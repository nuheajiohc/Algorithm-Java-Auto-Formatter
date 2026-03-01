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
