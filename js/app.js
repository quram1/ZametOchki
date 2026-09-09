// ====== ИМПОРТЫ ======
import { initRadio, setupRadioDrag } from './modules/radio.js';
import { getCurrentTheme, applyTheme, applyCustomTheme, loadAndApplyTheme, resetCustomTheme, createBackgroundElements } from './modules/theme.js';
import { initUI, renderNotesList, renderFolders, loadNoteToEditor, updateStats } from './modules/ui.js';
import { getNotes, getNote, setNotes, createNote, deleteNote, togglePin, updateNote, getNextId, setNextId, getCurrentNote } from './modules/notes.js';
import { getFolders, setFolders, createFolder, deleteFolder, getFolder } from './modules/folders.js';
import { getSelectedTag, setSelectedTag, updateTagFilterUI } from './modules/tags.js';
import { loadCustomTheme, saveCustomTheme, removeCustomTheme, saveNotes } from './modules/storage.js';
import { showToast, extractTags } from './modules/utils.js';
import { checkReminders, setReminder, removeReminder } from './modules/reminders.js';
import { updateToolbarState, initEditor } from './modules/editor.js';
import { renderPinnedImages, renderPinnedVideos, initMediaButtons } from './modules/media.js';
import { renderTodoItems } from './modules/todos.js';

// ====== СОСТОЯНИЕ ======
let notes = getNotes();
let currentNoteId = notes.length > 0 ? notes[0].id : null;
let currentFolderId = null;
let searchQuery = '';
let selectedTag = 'all';

// ====== ДЕЛАЕМ ФУНКЦИИ ДОСТУПНЫМИ ГЛОБАЛЬНО ======
window.getCurrentNote = getCurrentNote;
window.saveNotes = saveNotes;
window.renderNotesList = () => renderNotesList(currentNoteId, currentFolderId, searchQuery);
window.renderTodoItems = renderTodoItems;
window.renderPinnedImages = renderPinnedImages;
window.renderPinnedVideos = renderPinnedVideos;
window.updateCurrentNote = updateCurrentNote;
window.getNotes = getNotes;
window.getNote = getNote;
window.setNotes = setNotes;
window.createNote = createNote;
window.updateNote = updateNote;
window.deleteNote = deleteNote;

// ====== DOM ЭЛЕМЕНТЫ ======
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContent = document.getElementById('noteContent');
const noteContentWrapper = document.getElementById('noteContentWrapper');
const emptyState = document.getElementById('emptyState');
const pinBtn = document.getElementById('pinBtn');
const reminderBtn = document.getElementById('reminderBtn');
const searchInput = document.getElementById('searchInput');
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const themeToggle = document.getElementById('themeToggle');
const themeSettingsToggle = document.getElementById('themeSettingsToggle');
const themeSettingsPanel = document.getElementById('themeSettingsPanel');
const tagFilterSelected = document.getElementById('tagFilterSelected');
const tagFilterOptions = document.getElementById('tagFilterOptions');
const reminderModal = document.getElementById('reminderModal');
const reminderDateTime = document.getElementById('reminderDateTime');
const setReminderBtn = document.getElementById('setReminderBtn');
const removeReminderBtn = document.getElementById('removeReminderBtn');
const reminderModalClose = document.getElementById('reminderModalClose');
const radioDragHandle = document.getElementById('radioDragHandle');

// ====== ИНИЦИАЛИЗАЦИЯ UI ======
initUI();

// ====== ОБНОВЛЕНИЕ ТЕКУЩЕЙ ЗАМЕТКИ ======
function updateCurrentNote() {
    const note = getNote(currentNoteId);
    if (note) {
        const title = noteTitleInput.value.trim() || 'Без названия';
        const content = noteContent.innerHTML;
        updateNote(note.id, { title, content });
        renderNotesList(currentNoteId, currentFolderId, searchQuery);
        updateStats();
        updateTagFilterUI(tagFilterSelected, tagFilterOptions);
    }
}
window.updateCurrentNote = updateCurrentNote;

// ====== КОЛБЭКИ ======
window.onNoteClick = (noteId) => {
    if (currentNoteId !== null) updateCurrentNote();
    currentNoteId = noteId;
    const note = getNote(noteId);
    if (note) {
        loadNoteToEditor(note);
        renderNotesList(currentNoteId, currentFolderId, searchQuery);
    }
};

window.onFolderClick = (folderId) => {
    currentFolderId = folderId;
    renderFolders(currentFolderId);
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
};

window.onFolderDelete = (folderId) => {
    if (confirm('Удалить папку? Заметки останутся без папки.')) {
        const notes = getNotes();
        notes.forEach(n => { if (n.folder === folderId) n.folder = null; });
        setNotes(notes);
        deleteFolder(folderId);
        if (currentFolderId === folderId) currentFolderId = null;
        renderFolders(currentFolderId);
        renderNotesList(currentNoteId, currentFolderId, searchQuery);
        showToast('📁 Папка удалена', 'info');
    }
};

window.onNoteLoaded = (note) => {
    renderPinnedImages(note);
    renderPinnedVideos(note);
    renderTodoItems(note);
    setTimeout(updateToolbarState, 100);
    updateTagFilterUI(tagFilterSelected, tagFilterOptions);
};

// ====== СОЗДАНИЕ И УДАЛЕНИЕ ЗАМЕТОК ======
function createNewNote() {
    if (currentNoteId !== null) updateCurrentNote();
    const newNote = createNote({ folder: currentFolderId });
    currentNoteId = newNote.id;
    loadNoteToEditor(newNote);
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
    renderFolders(currentFolderId);
    updateStats();
    updateTagFilterUI(tagFilterSelected, tagFilterOptions);
    noteTitleInput.focus();
    noteTitleInput.select();
}
window.createNewNote = createNewNote;

function deleteCurrentNote() {
    if (currentNoteId === null) return;
    const note = getNote(currentNoteId);
    if (!note) return;
    if (!confirm(`Удалить заметку "${note.title || 'Без названия'}"?`)) return;

    deleteNote(currentNoteId);
    const notes = getNotes();

    if (notes.length === 0) {
        currentNoteId = null;
        loadNoteToEditor(null);
    } else {
        currentNoteId = notes[0].id;
        loadNoteToEditor(notes[0]);
    }
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
    renderFolders(currentFolderId);
    updateStats();
    updateTagFilterUI(tagFilterSelected, tagFilterOptions);
}

function togglePinNote() {
    const note = getNote(currentNoteId);
    if (!note) return;
    togglePin(note.id);
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
    pinBtn.classList.toggle('active', note.pinned);
}

// ====== ОБРАБОТЧИКИ СОБЫТИЙ ======
noteTitleInput.addEventListener('input', updateCurrentNote);
noteContent.addEventListener('input', updateCurrentNote);

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
});

newNoteBtn.addEventListener('click', createNewNote);
deleteNoteBtn.addEventListener('click', deleteCurrentNote);
pinBtn.addEventListener('click', togglePinNote);

// ====== ТЕМЫ ======
themeToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    if (btn.dataset.theme === 'custom') {
        themeSettingsPanel.classList.toggle('open');
        return;
    }
    themeSettingsPanel.classList.remove('open');
    applyTheme(btn.dataset.theme);
});

themeSettingsToggle.addEventListener('click', () => {
    themeSettingsPanel.classList.toggle('open');
});

document.getElementById('applyCustomTheme').addEventListener('click', () => {
    const data = {
        bodyBg: document.getElementById('customBodyBg').value,
        bgPrimary: document.getElementById('customBgPrimary').value,
        bgSecondary: document.getElementById('customBgSecondary').value,
        textPrimary: document.getElementById('customTextPrimary').value,
        accent: document.getElementById('customAccent').value,
        accentLight: document.getElementById('customAccent').value + '80',
        font: document.getElementById('customFont').value
    };
    applyCustomTheme(data);
    themeSettingsPanel.classList.remove('open');
    showToast('🎨 Тема применена!', 'success');
});

document.getElementById('resetCustomTheme').addEventListener('click', () => {
    resetCustomTheme();
    themeSettingsPanel.classList.remove('open');
    showToast('🔄 Тема сброшена', 'info');
});

// ====== ТЕГИ ======
const customSelect = document.querySelector('.search-filters .custom-select');
if (customSelect) {
    const selectedEl = customSelect.querySelector('.selected');
    if (selectedEl) {
        selectedEl.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('open');
        });
    }
}

tagFilterOptions.addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (!option) return;
    const value = option.dataset.value;
    setSelectedTag(value);
    customSelect.classList.remove('open');
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
    updateTagFilterUI(tagFilterSelected, tagFilterOptions);
});

// ====== НАПОМИНАНИЯ ======
reminderBtn.addEventListener('click', () => {
    const note = getNote(currentNoteId);
    if (!note) {
        showToast('Сначала выберите заметку', 'error');
        return;
    }
    if (note.reminder) {
        const date = new Date(note.reminder);
        reminderDateTime.value = date.toISOString().slice(0, 16);
    } else {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        reminderDateTime.value = now.toISOString().slice(0, 16);
    }
    reminderModal.classList.add('open');
});

setReminderBtn.addEventListener('click', () => {
    const note = getNote(currentNoteId);
    if (!note) return;
    if (!reminderDateTime.value) {
        showToast('Выберите дату и время', 'error');
        return;
    }
    setReminder(note.id, reminderDateTime.value);
    reminderModal.classList.remove('open');
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
});

removeReminderBtn.addEventListener('click', () => {
    const note = getNote(currentNoteId);
    if (!note) return;
    removeReminder(note.id);
    reminderModal.classList.remove('open');
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
});

reminderModalClose.addEventListener('click', () => {
    reminderModal.classList.remove('open');
});

reminderModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        reminderModal.classList.remove('open');
    }
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const now = new Date();
        const minutes = parseInt(btn.dataset.minutes) || 0;
        const hours = parseInt(btn.dataset.hours) || 0;
        now.setMinutes(now.getMinutes() + minutes);
        now.setHours(now.getHours() + hours);
        reminderDateTime.value = now.toISOString().slice(0, 16);
    });
});

// ====== ЭКСПОРТ/ИМПОРТ ======
document.getElementById('exportBtn').addEventListener('click', () => {
    const data = JSON.stringify({ notes: getNotes(), folders: getFolders() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zametochki_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Заметки и папки экспортированы!', 'success');
});

document.getElementById('importBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.notes && Array.isArray(imported.notes)) {
                    setNotes(imported.notes);
                    const maxId = Math.max(0, ...imported.notes.map(n => n.id));
                    setNextId(maxId + 1);
                }
                if (imported.folders && Array.isArray(imported.folders)) {
                    setFolders(imported.folders);
                }
                const notes = getNotes();
                if (notes.length > 0) {
                    currentNoteId = notes[0].id;
                    loadNoteToEditor(notes[0]);
                } else {
                    currentNoteId = null;
                    loadNoteToEditor(null);
                }
                renderNotesList(currentNoteId, currentFolderId, searchQuery);
                renderFolders(currentFolderId);
                updateStats();
                updateTagFilterUI(tagFilterSelected, tagFilterOptions);
                showToast('📥 Данные импортированы!', 'success');
            } catch (err) {
                showToast('❌ Ошибка импорта', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// ====== ДОБАВЛЕНИЕ ПАПКИ ======
document.getElementById('addFolderBtn').addEventListener('click', () => {
    const name = prompt('Название папки:');
    if (!name || name.trim() === '') return;
    createFolder(name.trim());
    renderFolders(currentFolderId);
});

// ====== РАДИО ======
initRadio();
setupRadioDrag(radioDragHandle);

// ====== РЕДАКТОР ======
initEditor();

// ====== МЕДИА ======
initMediaButtons();

// ====== КЛАВИАТУРНЫЕ СОЧЕТАНИЯ ======
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        updateCurrentNote();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
    }
});

// ====== ПРОВЕРКА НАПОМИНАНИЙ ======
setInterval(checkReminders, 10000);

// ====== АВТОСОХРАНЕНИЕ ======
setInterval(() => {
    if (currentNoteId !== null) updateCurrentNote();
}, 5000);

// ====== ИНИЦИАЛИЗАЦИЯ ======
function init() {
    // Фоновые элементы
    createBackgroundElements(getCurrentTheme());
    
    // Темы
    const customTheme = loadCustomTheme();
    if (customTheme) {
        applyCustomTheme(customTheme);
    } else {
        applyTheme(getCurrentTheme());
    }
    
    // Папки
    renderFolders(currentFolderId);
    
    // Заметки
    const notes = getNotes();
    if (notes.length > 0) {
        currentNoteId = notes[0].id;
        loadNoteToEditor(notes[0]);
    } else {
        currentNoteId = null;
        loadNoteToEditor(null);
    }
    renderNotesList(currentNoteId, currentFolderId, searchQuery);
    updateStats();
    updateTagFilterUI(tagFilterSelected, tagFilterOptions);
    
    // Уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Запуск!
init();

console.log('🚀 ЗаметОчки запущены!');