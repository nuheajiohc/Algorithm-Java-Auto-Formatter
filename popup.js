document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('toastToggle');

    // 1. 팝업이 열릴 때 저장된 설정 불러오기 (기본값: true)
    chrome.storage.local.get(['useToast'], function(result) {
        if (result.useToast !== undefined) {
            toggle.checked = result.useToast;
        }
    });

    // 2. 체크박스를 클릭하면 설정 저장하기
    toggle.addEventListener('change', function() {
        chrome.storage.local.set({ useToast: toggle.checked });
    });
});