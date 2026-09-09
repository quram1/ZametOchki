import { STORAGE_KEY, FOLDERS_KEY, THEME_KEY, CUSTOM_THEME_KEY, DEFAULT_NOTES, DEFAULT_FOLDERS } from './types.js';

// ====== ЗАМЕТКИ ======
export function loadNotes() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Ошибка загрузки заметок:', e);
    }
    return DEFAULT_NOTES;
}

export function saveNotes(notes) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (e) {}
}

// ====== ПАПКИ ======
export function loadFolders() {
    try {
        const data = localStorage.getItem(FOLDERS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Ошибка загрузки папок:', e);
    }
    return DEFAULT_FOLDERS;
}

export function saveFolders(folders) {
    try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); } catch (e) {}
}

// ====== ТЕМЫ ======
export function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) { return 'light'; }
}

export function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
}

export function loadCustomTheme() {
    try {
        const data = localStorage.getItem(CUSTOM_THEME_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
}

export function saveCustomTheme(data) {
    try { localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(data)); } catch (e) {}
}

export function removeCustomTheme() {
    try { localStorage.removeItem(CUSTOM_THEME_KEY); } catch (e) {}
}