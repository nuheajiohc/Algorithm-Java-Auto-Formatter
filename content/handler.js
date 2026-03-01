function handlePaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('Text');
    if (!isEditorTarget(e.target) || !looksLikeJavaCode(pastedText)) return;

    const modifiedText = transformJavaPasteText(pastedText, window.location.hostname);

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
