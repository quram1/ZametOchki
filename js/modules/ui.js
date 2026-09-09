import { getNotes, getNote, getCurrentNote } from './notes.js';
import { getFolders, getFolder, getFolderName } from './folders.js';
import { getSelectedTag, filterNotesByTag } from './tags.js';
import { extractTags } from './utils.js';

// DOM элементы (будут установлены при инициализации)
let notesListEl, foldersListEl, statsEl, emptyState, noteContentWrapper;
let noteTitleInput, noteContent, pinnedImagesContainer, pinnedVideosContainer, todoContainer;
let pinBtn, reminderBtn;

export function initUI() {
    notesListEl = document.getElementById('notesList');
    foldersListEl = document.getElementById('foldersList');
    statsEl = document.getElementById('stats');
    emptyState = document.getElementById('emptyState');
    noteContentWrapper = document.getElementById('noteContentWrapper');
    noteTitleInput = document.getElementById('noteTitleInput');
    noteContent = document.getElementById('noteContent');
    pinnedImagesContainer = document.getElementById('pinnedImagesContainer');
    pinnedVideosContainer = document.getElementById('pinnedVideosContainer');
    todoContainer = document.getElementById('todoContainer');
    pinBtn = document.getElementById('pinBtn');
    reminderBtn = document.getElementById('reminderBtn');
}

export function renderNotesList(currentNoteId, currentFolderId, searchQuery) {
    const notes = getNotes();
    
    // Если заметок нет
    if (notes.length === 0) {
        notesListEl.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.4;">📝</div>
                <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 6px;">Нет заметок</h3>
                <p style="font-size: 13px; color: var(--text-secondary);">Создайте свою первую заметку</p>
            </div>
        `;
        return;
    }

    let filtered = notes.filter(n => {
        if (currentFolderId !== null && n.folder !== currentFolderId) return false;
        if (!searchQuery) return true;
        return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               n.content.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const selectedTag = getSelectedTag();
    filtered = filterNotesByTag(filtered, selectedTag);

    const sorted = filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updated - a.updated;
    });

    notesListEl.innerHTML = '';
    
    if (sorted.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = `padding: 40px 20px; text-align: center; color: var(--text-muted);`;
        
        if (searchQuery || (selectedTag && selectedTag !== 'all')) {
            emptyDiv.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.4;">🔍</div>
                <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 6px;">Ничего не найдено</h3>
                <p style="font-size: 13px; color: var(--text-secondary);">Попробуйте изменить фильтры или поиск</p>
            `;
        } else if (currentFolderId !== null) {
            const folder = getFolder(currentFolderId);
            emptyDiv.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.4;">📁</div>
                <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 6px;">Папка "${folder?.name || 'Без названия'}" пуста</h3>
                <p style="font-size: 13px; color: var(--text-secondary);">Создайте новую заметку или переместите существующую</p>
            `;
        }
        notesListEl.appendChild(emptyDiv);
        return;
    }

    const folders = getFolders();
    sorted.forEach((note) => {
        const div = document.createElement('div');
        div.className = 'note-item' + (note.id === currentNoteId ? ' active' : '');
        div.dataset.noteId = note.id;
        const preview = note.content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').slice(0, 60);
        const tags = extractTags(note.content);
        const tagDisplay = tags.length > 0 ? tags.slice(0, 3).map(t => '#' + t).join(' ') : '';
        const hasReminder = note.reminder && !note.reminder_sent;
        const folderName = note.folder ? getFolderName(note.folder) : '';

        div.innerHTML = `
            <div class="title">
                ${note.title || 'Без названия'}
                ${note.pinned ? '<span class="pin">📌</span>' : ''}
                ${hasReminder ? '<span class="reminder-badge">⏰</span>' : ''}
                ${note.images && note.images.length > 0 ? ' 🖼️' : ''}
                ${note.videos && note.videos.length > 0 ? ' 🎬' : ''}
                ${note.todo_items && note.todo_items.length > 0 ? ' ☑️' : ''}
            </div>
            <div class="preview">${preview || 'Пустая заметка'}</div>
            ${tagDisplay ? `<div class="meta"><span style="color:var(--accent);font-size:10px;">${tagDisplay}</span></div>` : ''}
            <div class="meta">
                <span>${new Date(note.updated).toLocaleDateString('ru-RU')}</span>
                ${note.folder ? `<span>📁 ${folderName}</span>` : ''}
            </div>
        `;

        div.addEventListener('click', () => {
            // Вызываем колбэк из app.js
            if (window.onNoteClick) window.onNoteClick(note.id);
        });

        notesListEl.appendChild(div);
    });
}

export function renderFolders(currentFolderId) {
    const folders = getFolders();
    foldersListEl.innerHTML = '';
    
    const allFolder = document.createElement('div');
    allFolder.className = 'folder-item' + (currentFolderId === null ? ' active' : '');
    allFolder.textContent = '📂 Все';
    allFolder.addEventListener('click', () => {
        if (window.onFolderClick) window.onFolderClick(null);
    });
    foldersListEl.appendChild(allFolder);
    
    folders.forEach(folder => {
        const div = document.createElement('div');
        div.className = 'folder-item' + (folder.id === currentFolderId ? ' active' : '');
        div.innerHTML = `
            <span class="folder-color" style="background:${folder.color}"></span>
            ${folder.name}
            <button class="folder-delete" data-id="${folder.id}">✕</button>
        `;
        div.addEventListener('click', (e) => {
            if (e.target.closest('.folder-delete')) return;
            if (window.onFolderClick) window.onFolderClick(folder.id);
        });
        const deleteBtn = div.querySelector('.folder-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.onFolderDelete) window.onFolderDelete(folder.id);
        });
        foldersListEl.appendChild(div);
    });
}

export function loadNoteToEditor(note) {
    const notes = getNotes();
    
    if (notes.length === 0 || !note) {
        noteTitleInput.value = '';
        noteContent.innerHTML = '';
        pinnedImagesContainer.innerHTML = '';
        pinnedVideosContainer.innerHTML = '';
        if (todoContainer) todoContainer.innerHTML = '';
        emptyState.style.display = 'flex';
        noteContentWrapper.style.display = 'none';
        pinBtn.classList.remove('active');
        reminderBtn.classList.remove('active');
        return;
    }
    
    noteTitleInput.value = note.title || '';
    noteContent.innerHTML = note.content || '';
    emptyState.style.display = 'none';
    noteContentWrapper.style.display = 'block';
    pinBtn.classList.toggle('active', note.pinned);
    reminderBtn.classList.toggle('active', note.reminder && !note.reminder_sent);
    
    // Вызываем колбэки для рендеринга медиа и todo
    if (window.onNoteLoaded) window.onNoteLoaded(note);
}

export function updateStats() {
    const notes = getNotes();
    const folders = getFolders();
    const total = notes.length;
    const pinned = notes.filter(n => n.pinned).length;
    const folderCount = folders.length;
    statsEl.textContent = `${total} заметок${pinned ? `, ${pinned} закреплено` : ''}${folderCount ? `, ${folderCount} папок` : ''}`;
}