// ====== КОНСТАНТЫ ======
export const STORAGE_KEY = 'zametochki_notes';
export const THEME_KEY = 'zametochki_theme';
export const CUSTOM_THEME_KEY = 'zametochki_custom_theme';
export const FOLDERS_KEY = 'zametochki_folders';

// ====== НАЧАЛЬНЫЕ ДАННЫЕ ======
export const DEFAULT_NOTES = [];

export const DEFAULT_FOLDERS = [
    { id: 'folder_1', name: '📌 Избранное', color: '#ff6b6b', created: Date.now() },
    { id: 'folder_2', name: '💼 Работа', color: '#4ecdc4', created: Date.now() },
    { id: 'folder_3', name: '📖 Учёба', color: '#45b7d1', created: Date.now() }
];

export const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6348'];

// ====== ТРЕКИ ДЛЯ РАДИО ======
export const TRACKS = [
    { title: 'flux.fm', url: 'https://streams.fluxfm.de/Chillhop/mp3-128/' },
    { title: 'laut.fm', url: 'https://stream.laut.fm/lofi' }

];

// ====== ГЕНЕРАТОР ID ======
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}