// 맨 뒤에 'true'를 붙여서 이벤트를 가장 먼저 가로채게(Capture phase) 만듦
document.addEventListener('paste', function(e) {
    let clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    
    let pastedText = clipboardData.getData('Text');

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

        // package 선언부 제거 (빈 줄까지 깔끔하게 날리도록 정규식 조금 수정)
        let modifiedText = pastedText.replace(/package\s+[\w.]+;\s*\n*/g, '');
        
        // 클래스명을 Main 또는 Solution으로 변경
        modifiedText = modifiedText.replace(/public\s+class\s+\w+/g, `public class ${targetClassName}`);

        // 변환된 코드만 에디터에 삽입
        document.execCommand('insertText', false, modifiedText);
    }
}, true); // <--- 이 true가 아주 중요한 역할을 해!