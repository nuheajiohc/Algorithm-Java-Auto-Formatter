// [추가된 부분 1] 맨 위에 알림창(Toast) UI를 만들고 띄우는 함수를 선언해 줘!
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    // CSS 스타일링 (가운데 정렬 + 반투명 + 클릭 무시)
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%); /* 화면 정확히 한가운데로! */
        background-color: rgba(0, 0, 0, 0.3); /* 검은색을 65% 불투명도로 (반투명) */
        color: white;
        padding: 16px 32px;
        border-radius: 30px; /* 동글동글하고 예쁘게 */
        z-index: 99999;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        backdrop-filter: blur(2px); /* 뒤에 있는 코드가 살짝 블러 처리되어 보이게 (애플 감성) */
        pointer-events: none; /* 알림창이 떠 있어도 그 뒤에 있는 에디터 클릭 가능 */
        transition: opacity 0.5s ease-in-out;
    `;
    document.body.appendChild(toast);

    // 가운데 뜨니까 너무 오래 켜져 있으면 방해될 수 있어서 1초(1000ms) 뒤에 사라지게 세팅
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 1000);
}

// 맨 뒤에 'true'를 붙여서 이벤트를 가장 먼저 가로채게(Capture phase) 만듦
document.addEventListener('paste', function(e) {
    let clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    
    let pastedText = clipboardData.getData('Text');
    let modifiedText = pastedText; // 나중에 원본과 비교하기 위해 변수 분리

    // 자바 코드인지 확인
    if (pastedText.includes('public class') || pastedText.includes('package ')) {
        
        // ★ 핵심: 백준 에디터가 원래 코드를 붙여넣지 못하게 완벽히 차단
        e.preventDefault(); 
        e.stopPropagation(); 
        e.stopImmediatePropagation();

        const currentHost = window.location.hostname;
        let targetClassName = 'Main'; 
        if (currentHost.includes('swexpertacademy.com')) {
            targetClassName = 'Solution';
        }

        // package 선언부 제거 (한글, 영문, 숫자, _, $, 마침표가 포함된 패키지명 완벽 대응)
        modifiedText = pastedText.replace(/package\s+[a-zA-Z0-9_$가-힣.]+;\s*\n*/g, '');
        
        // 클래스명을 Main 또는 Solution으로 변경 (실제 자바 클래스명 규칙: 한글, 영문, _, $, 숫자 포함)
        modifiedText = modifiedText.replace(/public\s+class\s+[a-zA-Z_$가-힣][a-zA-Z0-9_$가-힣]*/g, `public class ${targetClassName}`);

        // 변환된 코드만 에디터에 삽입
        document.execCommand('insertText', false, modifiedText);

        // chrome.storage가 존재하는지 확인하고 실행
        if (typeof chrome !== 'undefined' && chrome?.storage?.local?.get) {
            chrome.storage.local.get(['useToast'], function(result) {
                if (result.useToast !== false) {
                    showToast('✨ 알고리즘 코드 자동 변환 완료!');
                }
            });
        } else {
            showToast('✨ 알고리즘 코드 자동 변환 완료!');
        }
    }
}, true); // <--- 이 true가 아주 중요한 역할을 해!