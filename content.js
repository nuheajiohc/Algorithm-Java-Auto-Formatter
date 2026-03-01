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

function maskJavaCommentsAndStrings(code) {
    let out = '';
    let state = 'normal';

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const next = code[i + 1];

        if (state === 'normal') {
            if (ch === '/' && next === '/') {
                out += '  ';
                i++;
                state = 'lineComment';
                continue;
            }
            if (ch === '/' && next === '*') {
                out += '  ';
                i++;
                state = 'blockComment';
                continue;
            }
            if (ch === '"') {
                out += ' ';
                state = 'string';
                continue;
            }
            if (ch === "'") {
                out += ' ';
                state = 'char';
                continue;
            }
            out += ch;
            continue;
        }

        if (state === 'lineComment') {
            if (ch === '\n') {
                out += '\n';
                state = 'normal';
            } else {
                out += ' ';
            }
            continue;
        }

        if (state === 'blockComment') {
            if (ch === '*' && next === '/') {
                out += '  ';
                i++;
                state = 'normal';
            } else {
                out += ch === '\n' ? '\n' : ' ';
            }
            continue;
        }

        if (state === 'string') {
            if (ch === '\\' && i + 1 < code.length) {
                out += '  ';
                i++;
                continue;
            }
            if (ch === '"') {
                out += ' ';
                state = 'normal';
            } else {
                out += ch === '\n' ? '\n' : ' ';
            }
            continue;
        }

        if (state === 'char') {
            if (ch === '\\' && i + 1 < code.length) {
                out += '  ';
                i++;
                continue;
            }
            if (ch === "'") {
                out += ' ';
                state = 'normal';
            } else {
                out += ch === '\n' ? '\n' : ' ';
            }
        }
    }

    return out;
}

function replaceLastClassName(source, maskedSource, replacementClassName) {
    const classNameRegex = /\bclass\s+([a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*)\b/g;
    let lastMatch = null;
    let match;

    while ((match = classNameRegex.exec(maskedSource)) !== null) {
        lastMatch = match;
    }

    if (!lastMatch) return source;

    const originalDecl = lastMatch[0];
    const originalName = lastMatch[1];
    const nameStart = lastMatch.index + originalDecl.length - originalName.length;
    const nameEnd = nameStart + originalName.length;

    return source.substring(0, nameStart) + replacementClassName + source.substring(nameEnd);
}

function findMainMethodIndex(maskedCode) {
    // public/final/static/strictfp 등 수식어 조합 + 개행을 허용한 main 선언 탐지
    const mainMethodRegex = /\b(?:public|protected|private|final|synchronized|native|strictfp|\s)*\bstatic\b(?:\s+\b(?:final|synchronized|native|strictfp)\b)*\s+void\s+main\s*\(/m;
    const match = maskedCode.match(mainMethodRegex);
    return match ? match.index : -1;
}

// main 메서드를 감싸는 실제 클래스의 "이름 토큰"만 안전하게 변경
function renameMainClass(code, replacementName) {
    const masked = maskJavaCommentsAndStrings(code);
    const replacementClassName = replacementName.trim().split(/\s+/).pop();

    if (!replacementClassName) return code;

    // 주석/문자열을 제외한 실제 main 메서드 위치를 찾음
    const mainIdx = findMainMethodIndex(masked);
    if (mainIdx === -1) return code;

    const beforeMainMasked = masked.substring(0, mainIdx);
    let depth = 0;

    // main을 감싸는 블록의 여는 중괄호를 역추적
    for (let i = beforeMainMasked.length - 1; i >= 0; i--) {
        if (beforeMainMasked[i] === '}') depth++;
        if (beforeMainMasked[i] === '{') depth--;

        if (depth === -1) {
            const header = code.substring(0, i);
            const headerMasked = masked.substring(0, i);
            const replacedHeader = replaceLastClassName(header, headerMasked, replacementClassName);
            return replacedHeader + code.substring(i);
        }
    }

    // 예비책: 주석/문자열 제외 상태에서 마지막 class 이름 교체
    return replaceLastClassName(code, masked, replacementClassName);
}

function isEditorTarget(target) {
    if (!target || !(target instanceof Element)) return false;

    const editor = target.closest('textarea, [contenteditable="true"], .CodeMirror, .cm-editor, .monaco-editor, [role="textbox"]');
    return Boolean(editor);
}

function looksLikeJavaCode(text) {
    if (!text || typeof text !== 'string') return false;

    const hasPackage = /^\s*package\s+[a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ.]+\s*;/m.test(text);
    const hasClassDecl = /\b(?:public\s+)?(?:final\s+|abstract\s+)?class\s+[a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*/.test(text);
    const hasMainMethod = /\b(?:public|protected|private|final|synchronized|native|strictfp|\s)*\bstatic\b(?:\s+\b(?:final|synchronized|native|strictfp)\b)*\s+void\s+main\s*\(/m.test(text);
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
        modifiedText = pastedText.replace(/package\s+[a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ.]+;\s*\n*/g, '');
        
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
