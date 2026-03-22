function isEditorTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    return Boolean(target.closest(EDITOR_SELECTOR));
}

function looksLikeJavaCode(text) {
    if (!text || typeof text !== 'string') return false;

    const masked = maskJavaCommentsAndStrings(text);
    const hasPackage = PACKAGE_DETECT_REGEX.test(masked);
    const hasClassDecl = CLASS_DETECT_REGEX.test(masked);
    const hasMainMethod = MAIN_METHOD_REGEX.test(masked);
    const hasJavaImport = JAVA_IMPORT_REGEX.test(masked);
    const hasJavaSignal = JAVA_SIGNAL_REGEX.test(masked);

    if (hasPackage) return true;
    if (hasClassDecl && (hasMainMethod || hasJavaImport || hasJavaSignal)) return true;
    return false;
}

function removePackageDeclaration(text) {
    const masked = maskJavaCommentsAndStrings(text);
    const packageRegex = new RegExp(PACKAGE_REGEX.source, PACKAGE_REGEX.flags);
    const ranges = [];
    let match;

    while ((match = packageRegex.exec(masked)) !== null) {
        ranges.push({ start: match.index, end: match.index + match[0].length });
    }

    if (ranges.length === 0) return text;

    let result = '';
    let cursor = 0;

    for (const range of ranges) {
        result += text.substring(cursor, range.start);
        cursor = range.end;
    }

    const removed = result + text.substring(cursor);
    return removed.replace(/^(?:[ \t]*\r?\n)+/, '');
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
