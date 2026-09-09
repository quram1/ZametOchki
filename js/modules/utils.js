// ====== TOAST УВЕДОМЛЕНИЯ ======
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// ====== ИЗВЛЕЧЕНИЕ ТЕГОВ ======
export function extractTags(content) {
    const tagRegex = /#([\w\u0400-\u04FF-]+)/g;
    const matches = content.match(tagRegex);
    if (!matches) return [];
    return matches.map(t => t.slice(1));
}

// ====== ГЕНЕРАТОР ID ======
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}