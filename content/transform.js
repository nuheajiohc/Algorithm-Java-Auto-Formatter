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

function transformJavaPasteText(text, hostname) {
    const replacementClassDecl = getReplacementClassDecl(hostname);
    let modifiedText = removePackageDeclaration(text);
    modifiedText = renameMainClass(modifiedText, replacementClassDecl);
    return modifiedText;
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
