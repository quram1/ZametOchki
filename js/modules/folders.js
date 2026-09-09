import { loadFolders, saveFolders } from './storage.js';
import { COLORS, generateId } from './types.js';
import { showToast } from './utils.js';

let folders = loadFolders();

export function getFolders() {
    return folders;
}

export function setFolders(newFolders) {
    folders = newFolders;
    saveFolders(folders);
}

export function createFolder(name) {
    if (!name || name.trim() === '') return null;
    const newFolder = {
        id: 'folder_' + generateId(),
        name: name.trim(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        created: Date.now()
    };
    folders.push(newFolder);
    saveFolders(folders);
    showToast('📁 Папка создана!', 'success');
    return newFolder;
}

export function deleteFolder(id) {
    folders = folders.filter(f => f.id !== id);
    saveFolders(folders);
}

export function getFolder(id) {
    return folders.find(f => f.id === id) || null;
}

export function getFolderName(id) {
    const folder = getFolder(id);
    return folder ? folder.name : '';
}