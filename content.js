const EDITOR_SELECTOR = 'textarea, [contenteditable="true"], .CodeMirror, .cm-editor, .monaco-editor, [role="textbox"]';
const SWEA_HOST_KEYWORD = 'swexpertacademy.com';

const MAIN_METHOD_REGEX = /\b(?:public|protected|private|final|synchronized|native|strictfp|\s)*\bstatic\b(?:\s+\b(?:final|synchronized|native|strictfp)\b)*\s+void\s+main\s*\(/m;
const PACKAGE_REGEX = /package\s+[a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ.]+;\s*\n*/g;
const PACKAGE_DETECT_REGEX = /^\s*package\s+[a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ.]+\s*;/m;
const CLASS_DETECT_REGEX = /\b(?:public\s+)?(?:final\s+|abstract\s+)?class\s+[a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*/;
const JAVA_IMPORT_REGEX = /^\s*import\s+java\./m;
const JAVA_SIGNAL_REGEX = /\bSystem\.out\.|Scanner\s*<|Scanner\s+|BufferedReader\s+|StringTokenizer\s+/;
const CLASS_NAME_REGEX = /\bclass\s+([a-zA-Z_$가-힣ㄱ-ㅎㅏ-ㅣ][a-zA-Z0-9_$가-힣ㄱ-ㅎㅏ-ㅣ]*)\b/g;

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
        border-radius: 30px !important;
        z-index: 999999 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
        backdrop-filter: blur(4px) !important;
        pointer-events: none !important;
        transition: opacity 0.5s ease-in-out !important;
        border: none !important;
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

function findMainMethodIndex(maskedCode) {
    const match = maskedCode.match(MAIN_METHOD_REGEX);
    return match ? match.index : -1;
}

function replaceLastClassName(source, maskedSource, replacementClassName) {
    let lastMatch = null;
    let match;

    while ((match = CLASS_NAME_REGEX.exec(maskedSource)) !== null) {
        lastMatch = match;
    }

    if (!lastMatch) return source;

    const originalDecl = lastMatch[0];
    const originalName = lastMatch[1];
    const nameStart = lastMatch.index + originalDecl.length - originalName.length;
    const nameEnd = nameStart + originalName.length;

    return source.substring(0, nameStart) + replacementClassName + source.substring(nameEnd);
}

function renameMainClass(code, replacementDecl) {
    const masked = maskJavaCommentsAndStrings(code);
    const replacementClassName = replacementDecl.trim().split(/\s+/).pop();
    if (!replacementClassName) return code;

    const mainIdx = findMainMethodIndex(masked);
    if (mainIdx === -1) return code;

    const beforeMainMasked = masked.substring(0, mainIdx);
    let depth = 0;

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

    return replaceLastClassName(code, masked, replacementClassName);
}

function isEditorTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    return Boolean(target.closest(EDITOR_SELECTOR));
}

function looksLikeJavaCode(text) {
    if (!text || typeof text !== 'string') return false;

    const hasPackage = PACKAGE_DETECT_REGEX.test(text);
    const hasClassDecl = CLASS_DETECT_REGEX.test(text);
    const hasMainMethod = MAIN_METHOD_REGEX.test(text);
    const hasJavaImport = JAVA_IMPORT_REGEX.test(text);
    const hasJavaSignal = JAVA_SIGNAL_REGEX.test(text);

    if (hasPackage) return true;
    if (hasClassDecl && (hasMainMethod || hasJavaImport || hasJavaSignal)) return true;
    return false;
}

function removePackageDeclaration(text) {
    return text.replace(PACKAGE_REGEX, '');
}

function getReplacementClassDecl(hostname) {
    return hostname.includes(SWEA_HOST_KEYWORD) ? 'class Solution' : 'public class Main';
}

function insertTextAtTarget(target, text) {
    if (!target || typeof text !== 'string') return false;

    if (target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type === 'text')) {
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        target.setRangeText(text, start, end, 'end');
        target.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    if (target instanceof Element) {
        const editable = target.closest('[contenteditable="true"]');
        if (editable) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;

            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);

            selection.removeAllRanges();
            selection.addRange(range);
            editable.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
    }

    return false;
}

function handlePaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('Text');
    if (!isEditorTarget(e.target) || !looksLikeJavaCode(pastedText)) return;

    const replacementClassDecl = getReplacementClassDecl(window.location.hostname);
    let modifiedText = removePackageDeclaration(pastedText);
    modifiedText = renameMainClass(modifiedText, replacementClassDecl);

    // 변경이 없으면 기본 붙여넣기를 그대로 사용
    if (modifiedText === pastedText) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const inserted = insertTextAtTarget(e.target, modifiedText);
    if (!inserted) {
        document.execCommand('insertText', false, modifiedText);
    }

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

document.addEventListener('paste', handlePaste, true);
