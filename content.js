// 알림창(Toast) 띄우는 함수
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background-color: rgba(0, 0, 0, 0.3) !important;
        color: white !important;
        padding: 16px 32px !important;
        border-radius: 30px !important; /* 여기서 둥근 모서리 강제 적용! */
        z-index: 999999 !important; /* z-index도 더 높임 */
        font-size: 16px !important;
        font-weight: bold !important;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
        backdrop-filter: blur(4px) !important;
        pointer-events: none !important;
        transition: opacity 0.5s ease-in-out !important;
        border: none !important; /* 혹시 모를 사이트 기본 테두리 방어 */
        margin: 0 !important;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 1500);
}

// ★ [신규 핵심 함수] main 메서드를 감싸는 진짜 본체 클래스를 찾아내는 알고리즘
function renameMainClass(code, replacementName) {
    // 1. main 메서드의 위치를 찾음
    let mainIdx = code.indexOf('static void main');
    if (mainIdx === -1) return code; // main이 없으면 원본 그대로 반환

    // 2. main 메서드 바로 앞까지의 코드를 자름
    let beforeMain = code.substring(0, mainIdx);
    let depth = 0;

    // 3. 뒤에서부터 거꾸로 읽으면서 중괄호 {} 짝을 맞춤 (스코프 역추적)
    for (let i = beforeMain.length - 1; i >= 0; i--) {
        if (beforeMain[i] === '}') depth++;
        if (beforeMain[i] === '{') depth--;

        // depth가 -1이 되는 순간이 바로 main을 감싸는 클래스의 여는 괄호 '{' 위치!
        if (depth === -1) {
            let header = beforeMain.substring(0, i);
            
            // 괄호 바로 앞부분에 있는 클래스 선언부만 정규식으로 찾아서 콕 집어 교체
            // (정규식 끝에 $를 써서 다른 내부 클래스를 무시하고 딱 해당 클래스만 잡음)
            let replacedHeader = header.replace(/(public\s+)?class\s+[a-zA-Z_$가-힣][a-zA-Z0-9_$가-힣]*\s*$/, replacementName + " ");
            
            // 교체된 헤더 + 괄호부터 끝까지의 원본 코드 결합
            return replacedHeader + code.substring(i);
        }
    }
    
    // 만약 구조가 특이해서 못 찾으면 예비책으로 첫 번째 클래스를 바꿈
    return code.replace(/(public\s+)?class\s+[a-zA-Z_$가-힣][a-zA-Z0-9_$가-힣]*/, replacementName);
}

function isEditorTarget(target) {
    if (!target || !(target instanceof Element)) return false;

    const editor = target.closest('textarea, [contenteditable="true"], .CodeMirror, .cm-editor, .monaco-editor, [role="textbox"]');
    return Boolean(editor);
}

function looksLikeJavaCode(text) {
    if (!text || typeof text !== 'string') return false;

    const hasPackage = /^\s*package\s+[a-zA-Z0-9_$가-힣.]+\s*;/m.test(text);
    const hasClassDecl = /\b(?:public\s+)?(?:final\s+|abstract\s+)?class\s+[a-zA-Z_$가-힣][a-zA-Z0-9_$가-힣]*/.test(text);
    const hasMainMethod = /\b(?:public\s+)?static\s+void\s+main\s*\(/.test(text);
    const hasJavaImport = /^\s*import\s+java\./m.test(text);
    const hasJavaSignal = /\bSystem\.out\.|Scanner\s*<|Scanner\s+|BufferedReader\s+|StringTokenizer\s+/.test(text);

    if (hasPackage) return true;
    if (hasClassDecl && (hasMainMethod || hasJavaImport || hasJavaSignal)) return true;
    return false;
}

// 복붙 이벤트 가로채기
document.addEventListener('paste', function(e) {
    let clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    
    let pastedText = clipboardData.getData('Text');
    let modifiedText = pastedText; 

    // 자바 코드 + 실제 코드 입력 영역인지 확인
    if (isEditorTarget(e.target) && looksLikeJavaCode(pastedText)) {
        const currentHost = window.location.hostname;
        
        // 사이트별 맞춤 클래스 선언 세팅
        let replacementClassDecl = 'public class Main'; 
        if (currentHost.includes('swexpertacademy.com')) {
            replacementClassDecl = 'class Solution'; 
        }

        // 1. 패키지 날리기 (한글, 특수문자 완벽 대응)
        modifiedText = pastedText.replace(/package\s+[a-zA-Z0-9_$가-힣.]+;\s*\n*/g, '');
        
        // 2. ★ 대망의 main 감싸는 본체 클래스 이름 바꾸기 함수 실행!
        modifiedText = renameMainClass(modifiedText, replacementClassDecl);

        // 실제 변경이 없으면 기본 붙여넣기를 그대로 사용 (알림도 띄우지 않음)
        if (modifiedText === pastedText) return;

        e.preventDefault(); 
        e.stopPropagation(); 
        e.stopImmediatePropagation();

        // 에디터에 삽입
        document.execCommand('insertText', false, modifiedText);

        // 알림 띄우기
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
}, true);
