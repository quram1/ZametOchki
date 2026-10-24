// ====== ДАННЫЕ ======
const STORAGE_KEY = 'zametochki_notes';
const THEME_KEY = 'zametochki_theme';
const CUSTOM_THEME_KEY = 'zametochki_custom_theme';
const FOLDERS_KEY = 'zametochki_folders';

function loadNotes() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Ошибка загрузки заметок:', e);
    }
    return [
        { id: 1, title: 'Добро пожаловать!', content: 'Это ЗаметОчки — минималистичное приложение для заметок.', pinned: true, created: Date.now() - 3600000, updated: Date.now() - 1800000, images: [], videos: [], folder: null, reminder: null, todo_items: [] },
        { id: 2, title: 'Идеи для проекта', content: '1. Добавить теги\n2. Экспорт в Markdown\n3. Поддержка изображений\n4. Облачное хранилище\n\n#проект #идеи', pinned: false, created: Date.now() - 7200000, updated: Date.now() - 3600000, images: [], videos: [], folder: null, reminder: null, todo_items: [] },
        { id: 3, title: 'Список покупок', content: '• Молоко\n• Хлеб\n• Яйца\n• Овощи\n• Фрукты\n\n#покупки', pinned: false, created: Date.now() - 14400000, updated: Date.now() - 7200000, images: [], videos: [], folder: null, reminder: null, todo_items: [] }
    ];
}

function loadFolders() {
    try {
        const data = localStorage.getItem(FOLDERS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Ошибка загрузки папок:', e);
    }
    return [
        { id: 'folder_1', name: '📌 Избранное', color: '#ff6b6b', created: Date.now() },
        { id: 'folder_2', name: '💼 Работа', color: '#4ecdc4', created: Date.now() },
        { id: 'folder_3', name: '📖 Учёба', color: '#45b7d1', created: Date.now() }
    ];
}

function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) { return 'light'; }
}

function loadCustomTheme() {
    try {
        const data = localStorage.getItem(CUSTOM_THEME_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
}

let notes = loadNotes();
let folders = loadFolders();
let nextId = Math.max(0, ...notes.map(n => n.id)) + 1;
let currentNoteId = notes.length > 0 ? notes[0].id : null;
let currentFolderId = null;
let searchQuery = '';
let currentTheme = loadTheme();
let customThemeData = loadCustomTheme();

// DOM
const notesListEl = document.getElementById('notesList');
const foldersListEl = document.getElementById('foldersList');
const searchInput = document.getElementById('searchInput');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContent = document.getElementById('noteContent');
const todoContainer = document.getElementById('todoContainer');
const noteContentWrapper = document.getElementById('noteContentWrapper');
const pinnedImagesContainer = document.getElementById('pinnedImagesContainer');
const pinnedVideosContainer = document.getElementById('pinnedVideosContainer');
const emptyState = document.getElementById('emptyState');
const statsEl = document.getElementById('stats');
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const pinBtn = document.getElementById('pinBtn');
const reminderBtn = document.getElementById('reminderBtn');
const imageBtn = document.getElementById('imageBtn');
const videoBtn = document.getElementById('videoBtn');
const themeToggle = document.getElementById('themeToggle');
const themeSettingsToggle = document.getElementById('themeSettingsToggle');
const themeSettingsPanel = document.getElementById('themeSettingsPanel');

// Кастомный фильтр тегов
const tagFilterSelected = document.getElementById('tagFilterSelected');
const tagFilterOptions = document.getElementById('tagFilterOptions');
let selectedTag = 'all';

// Радио
const radioWidget = document.getElementById('radioWidget');
const radioDragHandle = document.getElementById('radioDragHandle');
const radioPlayBtn = document.getElementById('radioPlayBtn');
const radioPrevBtn = document.getElementById('radioPrevBtn');
const radioNextBtn = document.getElementById('radioNextBtn');
const radioVolume = document.getElementById('radioVolume');
const volumeLabel = document.getElementById('volumeLabel');
const nowPlaying = document.getElementById('nowPlaying');
const collapseBtn = document.getElementById('collapseBtn');

// Модальное окно напоминания
const reminderModal = document.getElementById('reminderModal');
const reminderDateTime = document.getElementById('reminderDateTime');
const setReminderBtn = document.getElementById('setReminderBtn');
const removeReminderBtn = document.getElementById('removeReminderBtn');
const reminderModalClose = document.getElementById('reminderModalClose');

// ====== TOAST УВЕДОМЛЕНИЯ ======
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// ====== КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК ТЕГОВ ======
function updateTagFilterUI() {
    const allTags = new Set();
    notes.forEach(note => {
        const tags = extractTags(note.content);
        tags.forEach(t => allTags.add(t));
    });
    
    const currentValue = selectedTag;
    tagFilterOptions.innerHTML = '';
    
    const allOption = document.createElement('div');
    allOption.className = 'option' + (currentValue === 'all' ? ' active' : '');
    allOption.textContent = '📋 Все теги';
    allOption.dataset.value = 'all';
    allOption.addEventListener('click', (e) => {
        e.stopPropagation();
        selectTag('all');
    });
    tagFilterOptions.appendChild(allOption);
    
    allTags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'option' + (tag === currentValue ? ' active' : '');
        option.textContent = '#' + tag;
        option.dataset.value = tag;
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTag(tag);
        });
        tagFilterOptions.appendChild(option);
    });
    
    if (currentValue === 'all') {
        tagFilterSelected.textContent = '📋 Все теги';
    } else {
        tagFilterSelected.textContent = '#' + currentValue;
    }
}

function selectTag(value) {
    selectedTag = value;
    document.querySelector('.search-filters .custom-select').classList.remove('open');
    renderNotesList();
    updateTagFilterUI();
}

document.querySelector('.search-filters .custom-select .selected').addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.search-filters .custom-select').classList.toggle('open');
});

document.addEventListener('click', () => {
    document.querySelector('.search-filters .custom-select')?.classList.remove('open');
});

// ====== ПАПКИ ======
function renderFolders() {
    foldersListEl.innerHTML = '';
    
    const allFolder = document.createElement('div');
    allFolder.className = 'folder-item' + (currentFolderId === null ? ' active' : '');
    allFolder.textContent = '📂 Все';
    allFolder.addEventListener('click', () => {
        currentFolderId = null;
        renderFolders();
        renderNotesList();
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
            currentFolderId = folder.id;
            renderFolders();
            renderNotesList();
        });
        const deleteBtn = div.querySelector('.folder-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Удалить папку "${folder.name}"? Заметки останутся без папки.`)) {
                notes.forEach(n => { if (n.folder === folder.id) n.folder = null; });
                folders = folders.filter(f => f.id !== folder.id);
                saveFolders();
                saveNotes();
                if (currentFolderId === folder.id) currentFolderId = null;
                renderFolders();
                renderNotesList();
                showToast('📁 Папка удалена', 'info');
            }
        });
        foldersListEl.appendChild(div);
    });
}

function saveFolders() {
    try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); } catch (e) {}
}

document.getElementById('addFolderBtn').addEventListener('click', () => {
    const name = prompt('Название папки:');
    if (!name || name.trim() === '') return;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6348'];
    const newFolder = {
        id: 'folder_' + Date.now(),
        name: name.trim(),
        color: colors[Math.floor(Math.random() * colors.length)],
        created: Date.now()
    };
    folders.push(newFolder);
    saveFolders();
    renderFolders();
    showToast('📁 Папка создана!', 'success');
});

// ====== РАДИО ======
let audio = null;
let isPlaying = false;
let currentTrackIndex = 0;
let isCollapsed = false;

const tracks = [
    { title: 'Lo-fi Chill', url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Arps_1.mp3' },
    { title: 'Study Beats', url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Arps_2.mp3' },
    { title: 'Relaxation', url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Arps_3.mp3' },
    { title: 'Dreamy Lo-fi', url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Arps_4.mp3' }
];

function initRadio() {
    audio = new Audio();
    audio.volume = radioVolume.value / 100;
    audio.addEventListener('ended', () => { playNext(); });
    audio.addEventListener('error', () => { playNext(); });
    loadTrack(currentTrackIndex);
    audio.load();
}

function loadTrack(index) {
    currentTrackIndex = index;
    const track = tracks[index];
    audio.src = track.url;
    nowPlaying.textContent = track.title;
    if (isPlaying) {
        audio.play().catch(() => {
            nowPlaying.textContent = 'Ошибка загрузки';
            setTimeout(() => playNext(), 2000);
        });
    }
}

function togglePlay() {
    if (!audio) return;
    if (isPlaying) {
        audio.pause();
        radioPlayBtn.textContent = '▶';
    } else {
        audio.play().catch(() => {
            nowPlaying.textContent = 'Ошибка: проверьте ссылки';
            setTimeout(() => playNext(), 2000);
        });
        radioPlayBtn.textContent = '⏸';
    }
    isPlaying = !isPlaying;
}

function playNext() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audio.play().catch(() => {});
    }
}

function playPrev() {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audio.play().catch(() => {});
    }
}

radioPlayBtn.addEventListener('click', togglePlay);
radioPrevBtn.addEventListener('click', playPrev);
radioNextBtn.addEventListener('click', playNext);

radioVolume.addEventListener('input', () => {
    if (audio) {
        audio.volume = radioVolume.value / 100;
        volumeLabel.textContent = radioVolume.value + '%';
    }
});

collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isCollapsed = !isCollapsed;
    radioWidget.classList.toggle('collapsed', isCollapsed);
    collapseBtn.textContent = isCollapsed ? '+' : '−';
});

// Перетаскивание радио
let radioDragData = null;
radioDragHandle.addEventListener('mousedown', startRadioDrag);
radioDragHandle.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startRadioDrag(mouseEvent);
    e.preventDefault();
});

function startRadioDrag(e) {
    if (e.target.closest('.collapse-btn')) return;
    radioDragData = {
        startX: e.clientX,
        startY: e.clientY,
        rect: radioWidget.getBoundingClientRect()
    };
    document.addEventListener('mousemove', radioDragMove);
    document.addEventListener('mouseup', radioDragEnd);
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        radioDragMove(mouseEvent);
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', radioDragEnd);
    e.preventDefault();
}

function radioDragMove(e) {
    if (!radioDragData) return;
    const dx = e.clientX - radioDragData.startX;
    const dy = e.clientY - radioDragData.startY;
    radioWidget.style.right = 'auto';
    radioWidget.style.bottom = 'auto';
    radioWidget.style.left = (radioDragData.rect.left + dx) + 'px';
    radioWidget.style.top = (radioDragData.rect.top + dy) + 'px';
}

function radioDragEnd() {
    radioDragData = null;
    document.removeEventListener('mousemove', radioDragMove);
    document.removeEventListener('mouseup', radioDragEnd);
    document.removeEventListener('touchmove', radioDragMove);
    document.removeEventListener('touchend', radioDragEnd);
}

// ====== ФОНОВЫЕ ЭЛЕМЕНТЫ ======
function createBackgroundElements() {
    document.querySelectorAll('.leaf, .wave-emoji, .sun-emoji, .star').forEach(el => el.remove());

    const leafEmojis = ['🍃', '🌿', '🍂', '🌱'];
    const leafPositions = [
        { left: '2%', top: '5%', tx: '80px', ty: '120px', rot: '180deg', duration: '14s', delay: '0s' },
        { left: '85%', top: '8%', tx: '-70px', ty: '100px', rot: '-160deg', duration: '16s', delay: '2s' },
        { left: '5%', top: '40%', tx: '100px', ty: '80px', rot: '200deg', duration: '18s', delay: '4s' },
        { left: '90%', top: '45%', tx: '-90px', ty: '110px', rot: '-190deg', duration: '15s', delay: '1s' },
        { left: '15%', top: '70%', tx: '60px', ty: '100px', rot: '170deg', duration: '17s', delay: '3s' },
        { left: '80%', top: '75%', tx: '-80px', ty: '90px', rot: '-210deg', duration: '19s', delay: '5s' },
        { left: '45%', top: '3%', tx: '50px', ty: '130px', rot: '150deg', duration: '13s', delay: '6s' },
        { left: '55%', top: '85%', tx: '-50px', ty: '100px', rot: '-170deg', duration: '16s', delay: '2.5s' }
    ];

    leafPositions.forEach((pos, i) => {
        const el = document.createElement('div');
        el.className = 'leaf';
        el.textContent = leafEmojis[i % leafEmojis.length];
        el.style.left = pos.left;
        el.style.top = pos.top;
        el.style.setProperty('--tx', pos.tx);
        el.style.setProperty('--ty', pos.ty);
        el.style.setProperty('--rot', pos.rot);
        el.style.setProperty('--duration', pos.duration);
        el.style.setProperty('--delay', pos.delay);
        el.style.display = currentTheme === 'forest' ? 'block' : 'none';
        document.body.appendChild(el);
    });

    const waveEmojis = ['🌊', '🏄', '🐚', '🐠', '🐙'];
    const wavePositions = [
        { left: '3%', bottom: '5%', duration: '8s', delay: '0s' },
        { left: '25%', bottom: '12%', duration: '10s', delay: '2s' },
        { left: '50%', bottom: '3%', duration: '9s', delay: '4s' },
        { left: '75%', bottom: '15%', duration: '11s', delay: '1s' },
        { left: '92%', bottom: '6%', duration: '7s', delay: '3s' }
    ];

    wavePositions.forEach((pos, i) => {
        const el = document.createElement('div');
        el.className = 'wave-emoji';
        el.textContent = waveEmojis[i % waveEmojis.length];
        el.style.left = pos.left;
        el.style.bottom = pos.bottom;
        el.style.setProperty('--duration', pos.duration);
        el.style.setProperty('--delay', pos.delay);
        el.style.display = currentTheme === 'ocean' ? 'block' : 'none';
        document.body.appendChild(el);
    });

    const sun = document.createElement('div');
    sun.className = 'sun-emoji';
    sun.textContent = '☀️';
    sun.style.display = currentTheme === 'sunset' ? 'block' : 'none';
    document.body.appendChild(sun);

    const starPositions = [
        { left: '5%', top: '8%', size: '3px', opacity: '0.6', duration: '3s', delay: '0s' },
        { left: '15%', top: '20%', size: '2px', opacity: '0.4', duration: '4s', delay: '1s' },
        { left: '30%', top: '5%', size: '4px', opacity: '0.7', duration: '3.5s', delay: '0.5s' },
        { left: '45%', top: '15%', size: '2px', opacity: '0.5', duration: '4.5s', delay: '2s' },
        { left: '60%', top: '8%', size: '3px', opacity: '0.6', duration: '3s', delay: '1.5s' },
        { left: '75%', top: '22%', size: '2px', opacity: '0.4', duration: '4s', delay: '0.8s' },
        { left: '88%', top: '10%', size: '3px', opacity: '0.5', duration: '3.8s', delay: '2.5s' },
        { left: '95%', top: '30%', size: '2px', opacity: '0.3', duration: '5s', delay: '1.2s' },
        { left: '10%', top: '45%', size: '2px', opacity: '0.4', duration: '4.2s', delay: '3s' },
        { left: '70%', top: '40%', size: '3px', opacity: '0.5', duration: '3.5s', delay: '2s' }
    ];

    starPositions.forEach(pos => {
        const el = document.createElement('div');
        el.className = 'star';
        el.style.left = pos.left;
        el.style.top = pos.top;
        el.style.width = pos.size;
        el.style.height = pos.size;
        el.style.setProperty('--star-opacity', pos.opacity);
        el.style.setProperty('--duration', pos.duration);
        el.style.setProperty('--delay', pos.delay);
        el.style.display = currentTheme === 'dark' ? 'block' : 'none';
        document.body.appendChild(el);
    });
}

// ====== ТЕМЫ ======
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    currentTheme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}

    themeToggle.querySelectorAll('button[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    document.querySelectorAll('.leaf').forEach(el => {
        el.style.display = theme === 'forest' ? 'block' : 'none';
    });
    document.querySelectorAll('.wave-emoji').forEach(el => {
        el.style.display = theme === 'ocean' ? 'block' : 'none';
    });
    document.querySelectorAll('.sun-emoji').forEach(el => {
        el.style.display = theme === 'sunset' ? 'block' : 'none';
    });
    document.querySelectorAll('.star').forEach(el => {
        el.style.display = theme === 'dark' ? 'block' : 'none';
    });
}

function applyCustomTheme(data) {
    if (!data) return;
    document.body.className = 'theme-custom';
    document.body.style.setProperty('--custom-body-bg', data.bodyBg || '#0a0a1a');
    document.body.style.setProperty('--custom-bg-primary', data.bgPrimary || '#1a1a2e');
    document.body.style.setProperty('--custom-bg-secondary', data.bgSecondary || '#16213e');
    document.body.style.setProperty('--custom-text-primary', data.textPrimary || '#e8e8f0');
    document.body.style.setProperty('--custom-accent', data.accent || '#7c6cf0');
    document.body.style.setProperty('--custom-accent-light', data.accentLight || '#a29bfe');
    if (data.font) {
        document.body.style.fontFamily = data.font;
        document.querySelectorAll('input, textarea, button, select').forEach(el => {
            el.style.fontFamily = data.font;
        });
    }
    currentTheme = 'custom';
    customThemeData = data;
    try { localStorage.setItem(THEME_KEY, 'custom'); } catch (e) {}
    try { localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(data)); } catch (e) {}

    themeToggle.querySelectorAll('button[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === 'custom');
    });

    document.querySelectorAll('.leaf, .wave-emoji, .sun-emoji, .star').forEach(el => {
        el.style.display = 'none';
    });
}

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
    try { localStorage.removeItem(CUSTOM_THEME_KEY); } catch (e) {}
    customThemeData = null;
    applyTheme('dark');
    themeSettingsPanel.classList.remove('open');
    showToast('🔄 Тема сброшена', 'info');
});

// ====== ЭКСПОРТ/ИМПОРТ ======
document.getElementById('exportBtn').addEventListener('click', () => {
    const data = JSON.stringify({ notes, folders }, null, 2);
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
                    notes = imported.notes;
                    nextId = Math.max(0, ...notes.map(n => n.id)) + 1;
                }
                if (imported.folders && Array.isArray(imported.folders)) {
                    folders = imported.folders;
                }
                saveNotes();
                saveFolders();
                renderFolders();
                renderNotesList();
                updateStats();
                updateTagFilterUI();
                if (notes.length > 0) {
                    currentNoteId = notes[0].id;
                    loadNoteToEditor(notes[0]);
                }
                showToast('📥 Данные импортированы!', 'success');
            } catch (err) {
                showToast('❌ Ошибка импорта', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// ====== ТЕГИ ======
function extractTags(content) {
    const tagRegex = /#([\w\u0400-\u04FF-]+)/g;
    const matches = content.match(tagRegex);
    if (!matches) return [];
    return matches.map(t => t.slice(1));
}

// ====== СОХРАНЕНИЕ ======
function saveNotes() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (e) {}
}

function getCurrentNote() {
    return notes.find(n => n.id === currentNoteId) || null;
}

function updateCurrentNote() {
    const note = getCurrentNote();
    if (note) {
        note.title = noteTitleInput.value.trim() || 'Без названия';
        note.content = noteContent.innerHTML;
        note.updated = Date.now();
        saveNotes();
        renderNotesList();
        updateStats();
        updateTagFilterUI();
    }
}

// ====== ЧЕК-ЛИСТЫ ======
function renderTodoItems(note) {
    if (!todoContainer) return;
    todoContainer.innerHTML = '';
    
    if (!note || !note.todo_items || note.todo_items.length === 0) {
        const addBtn = document.createElement('button');
        addBtn.className = 'add-todo-btn';
        addBtn.innerHTML = '➕ Добавить задачу';
        addBtn.addEventListener('click', () => addNewTodo(note));
        todoContainer.appendChild(addBtn);
        return;
    }
    
    note.todo_items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'todo-item' + (item.checked ? ' checked' : '');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.checked;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            note.todo_items[index].checked = checkbox.checked;
            note.updated = Date.now();
            saveNotes();
            renderTodoItems(note);
        });
        
        const text = document.createElement('span');
        text.textContent = item.text;
        
        const remove = document.createElement('button');
        remove.className = 'todo-remove';
        remove.textContent = '✕';
        remove.title = 'Удалить задачу';
        remove.addEventListener('click', (e) => {
            e.stopPropagation();
            note.todo_items.splice(index, 1);
            note.updated = Date.now();
            saveNotes();
            renderTodoItems(note);
            renderNotesList();
        });
        
        div.appendChild(checkbox);
        div.appendChild(text);
        div.appendChild(remove);
        todoContainer.appendChild(div);
    });
    
    const addBtn = document.createElement('button');
    addBtn.className = 'add-todo-btn';
    addBtn.innerHTML = '➕ Добавить еще';
    addBtn.addEventListener('click', () => addNewTodo(note));
    todoContainer.appendChild(addBtn);
}

function addNewTodo(note) {
    if (!note) return;
    if (!note.todo_items) note.todo_items = [];
    
    const text = prompt('Введите текст задачи:');
    if (text && text.trim() !== '') {
        note.todo_items.push({ text: text.trim(), checked: false });
        note.updated = Date.now();
        saveNotes();
        renderTodoItems(note);
        renderNotesList();
    }
}

// ====== НАПОМИНАНИЯ ======
function checkReminders() {
    const now = Date.now();
    notes.forEach(note => {
        if (note.reminder && note.reminder <= now && !note.reminder_sent) {
            note.reminder_sent = true;
            saveNotes();
            showToast(`⏰ Напоминание: "${note.title || 'Без названия'}"`, 'info');
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('ЗаметОчки', {
                    body: `Напоминание: ${note.title || 'Без названия'}`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📝</text></svg>'
                });
            }
            renderNotesList();
        }
    });
}

function setReminder(noteId, dateTime) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.reminder = new Date(dateTime).getTime();
    note.reminder_sent = false;
    note.updated = Date.now();
    saveNotes();
    renderNotesList();
    showToast('⏰ Напоминание установлено!', 'success');
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function removeReminder(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.reminder = null;
    note.reminder_sent = false;
    note.updated = Date.now();
    saveNotes();
    renderNotesList();
    showToast('Напоминание удалено', 'info');
}

// ====== ФУНКЦИЯ ИЗМЕНЕНИЯ РАЗМЕРА ======
function startResize(e, element, data, type) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = data.width;
    const startHeight = data.height;

    const onResize = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newWidth = Math.max(50, startWidth + dx);
        let newHeight = Math.max(50, startHeight + dy);
        const ratio = startWidth / startHeight;
        if (Math.abs(dx) > Math.abs(dy)) {
            newHeight = newWidth / ratio;
        } else {
            newWidth = newHeight * ratio;
        }
        data.width = newWidth;
        data.height = newHeight;
        element.style.width = newWidth + 'px';
        element.style.height = newHeight + 'px';
        const note = getCurrentNote();
        if (note) saveNotes();
    };

    const onResizeEnd = () => {
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', onResizeEnd);
    };

    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeEnd);
}

// ====== ИЗОБРАЖЕНИЯ ======
function renderPinnedImages(note) {
    pinnedImagesContainer.innerHTML = '';
    if (!note || !note.images || note.images.length === 0) return;

    note.images.forEach((imgData, index) => {
        const div = document.createElement('div');
        div.className = 'pinned-image';
        div.style.left = imgData.x + 'px';
        div.style.top = imgData.y + 'px';
        div.style.width = imgData.width + 'px';
        div.style.height = imgData.height + 'px';

        const img = document.createElement('img');
        img.src = imgData.src;
        img.draggable = false;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '12px';
        div.appendChild(img);

        const pinIcon = document.createElement('div');
        pinIcon.className = 'pin-icon';
        pinIcon.textContent = '📌';
        div.appendChild(pinIcon);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-img';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const note = getCurrentNote();
            if (note && note.images) {
                note.images.splice(index, 1);
                saveNotes();
                renderPinnedImages(note);
            }
        });
        div.appendChild(removeBtn);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        div.appendChild(resizeHandle);

        let dragData = null;
        div.addEventListener('mousedown', (e) => {
            if (e.target.closest('.remove-img') || e.target.closest('.resize-handle')) {
                if (e.target.closest('.resize-handle')) {
                    startResize(e, div, imgData, 'image');
                }
                return;
            }
            const rect = div.getBoundingClientRect();
            const wrapperRect = noteContentWrapper.getBoundingClientRect();
            dragData = {
                startX: e.clientX,
                startY: e.clientY,
                origX: imgData.x,
                origY: imgData.y,
                wrapperRect: wrapperRect
            };
            document.addEventListener('mousemove', imgDragMove);
            document.addEventListener('mouseup', imgDragEnd);
            e.preventDefault();
        });

        const imgDragMove = (e) => {
            if (!dragData) return;
            const dx = e.clientX - dragData.startX;
            const dy = e.clientY - dragData.startY;
            let newX = dragData.origX + dx;
            let newY = dragData.origY + dy;
            newX = Math.max(0, Math.min(newX, dragData.wrapperRect.width - imgData.width));
            newY = Math.max(0, Math.min(newY, dragData.wrapperRect.height - imgData.height));
            imgData.x = newX;
            imgData.y = newY;
            div.style.left = newX + 'px';
            div.style.top = newY + 'px';
        };

        const imgDragEnd = () => {
            if (dragData) {
                const note = getCurrentNote();
                if (note) saveNotes();
            }
            dragData = null;
            document.removeEventListener('mousemove', imgDragMove);
            document.removeEventListener('mouseup', imgDragEnd);
        };

        pinnedImagesContainer.appendChild(div);
    });
}

imageBtn.addEventListener('click', () => {
    const note = getCurrentNote();
    if (!note) {
        showToast('Сначала выберите заметку', 'error');
        return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
        if (!note.images) note.images = [];
        const files = Array.from(input.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const maxW = 200, maxH = 200;
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = h * maxW / w; w = maxW; }
                    if (h > maxH) { w = w * maxH / h; h = maxH; }
                    const wrapperWidth = noteContentWrapper.clientWidth || 500;
                    const wrapperHeight = noteContentWrapper.clientHeight || 300;
                    note.images.push({
                        src: ev.target.result,
                        x: Math.random() * (wrapperWidth - w - 20),
                        y: Math.random() * (wrapperHeight - h - 20),
                        width: w,
                        height: h
                    });
                    saveNotes();
                    renderPinnedImages(note);
                    showToast('🖼️ Изображение добавлено!', 'success');
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    };
    input.click();
});

// ====== ВИДЕО ======
function renderPinnedVideos(note) {
    pinnedVideosContainer.innerHTML = '';
    if (!note || !note.videos || note.videos.length === 0) return;

    note.videos.forEach((videoData, index) => {
        const div = document.createElement('div');
        div.className = 'pinned-video';
        div.style.left = videoData.x + 'px';
        div.style.top = videoData.y + 'px';
        div.style.width = videoData.width + 'px';
        div.style.height = videoData.height + 'px';

        const video = document.createElement('video');
        video.src = videoData.src;
        video.controls = false;
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.borderRadius = '12px';
        video.style.pointerEvents = 'none';
        video.addEventListener('click', (e) => e.stopPropagation());
        div.appendChild(video);

        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.innerHTML = '<span class="play-icon">▶</span>';
        div.appendChild(overlay);

        const pinIcon = document.createElement('div');
        pinIcon.className = 'pin-icon';
        pinIcon.textContent = '📌';
        div.appendChild(pinIcon);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-video';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const note = getCurrentNote();
            if (note && note.videos) {
                note.videos.splice(index, 1);
                saveNotes();
                renderPinnedVideos(note);
            }
        });
        div.appendChild(removeBtn);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        div.appendChild(resizeHandle);

        let dragData = null;
        div.addEventListener('mousedown', (e) => {
            if (e.target.closest('.remove-video') || e.target.closest('.resize-handle')) {
                if (e.target.closest('.resize-handle')) {
                    startResize(e, div, videoData, 'video');
                }
                return;
            }
            const rect = div.getBoundingClientRect();
            const wrapperRect = noteContentWrapper.getBoundingClientRect();
            dragData = {
                startX: e.clientX,
                startY: e.clientY,
                origX: videoData.x,
                origY: videoData.y,
                wrapperRect: wrapperRect
            };
            document.addEventListener('mousemove', videoDragMove);
            document.addEventListener('mouseup', videoDragEnd);
            e.preventDefault();
        });

        const videoDragMove = (e) => {
            if (!dragData) return;
            const dx = e.clientX - dragData.startX;
            const dy = e.clientY - dragData.startY;
            let newX = dragData.origX + dx;
            let newY = dragData.origY + dy;
            newX = Math.max(0, Math.min(newX, dragData.wrapperRect.width - videoData.width));
            newY = Math.max(0, Math.min(newY, dragData.wrapperRect.height - videoData.height));
            videoData.x = newX;
            videoData.y = newY;
            div.style.left = newX + 'px';
            div.style.top = newY + 'px';
        };

        const videoDragEnd = () => {
            if (dragData) {
                const note = getCurrentNote();
                if (note) saveNotes();
            }
            dragData = null;
            document.removeEventListener('mousemove', videoDragMove);
            document.removeEventListener('mouseup', videoDragEnd);
        };

        div.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (video.paused) {
                video.play().catch(() => {});
                overlay.style.display = 'none';
            } else {
                video.pause();
                overlay.style.display = 'flex';
            }
        });

        pinnedVideosContainer.appendChild(div);
    });
}

videoBtn.addEventListener('click', () => {
    const note = getCurrentNote();
    if (!note) {
        showToast('Сначала выберите заметку', 'error');
        return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    input.onchange = () => {
        if (!note.videos) note.videos = [];
        const files = Array.from(input.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const video = document.createElement('video');
                video.src = ev.target.result;
                video.onloadedmetadata = () => {
                    const maxW = 250, maxH = 180;
                    let w = video.videoWidth, h = video.videoHeight;
                    if (w > maxW) { h = h * maxW / w; w = maxW; }
                    if (h > maxH) { w = w * maxH / h; h = maxH; }
                    const wrapperWidth = noteContentWrapper.clientWidth || 500;
                    const wrapperHeight = noteContentWrapper.clientHeight || 300;
                    note.videos.push({
                        src: ev.target.result,
                        x: Math.random() * (wrapperWidth - w - 20),
                        y: Math.random() * (wrapperHeight - h - 20),
                        width: Math.max(100, w),
                        height: Math.max(70, h)
                    });
                    saveNotes();
                    renderPinnedVideos(note);
                    showToast('🎬 Видео добавлено!', 'success');
                };
                video.load();
            };
            reader.readAsDataURL(file);
        });
    };
    input.click();
});

// ====== ПАНЕЛЬ ИНСТРУМЕНТОВ ======
function updateToolbarState() {
    const editor = document.getElementById('noteContent');
    if (!editor) return;
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parent = container.nodeType === 3 ? container.parentElement : container;
    
    const btnActions = ['bold', 'italic', 'underline', 'strike', 'h1', 'h2', 'h3', 'list', 'quote', 'code'];
    
    btnActions.forEach(action => {
        const btn = document.querySelector(`.toolbar-btn[data-action="${action}"]`);
        if (!btn) return;
        
        let isActive = false;
        
        switch(action) {
            case 'bold':
                isActive = document.queryCommandState('bold');
                break;
            case 'italic':
                isActive = document.queryCommandState('italic');
                break;
            case 'underline':
                isActive = document.queryCommandState('underline');
                break;
            case 'strike':
                isActive = document.queryCommandState('strikeThrough');
                break;
            case 'h1':
                isActive = parent && parent.tagName === 'H1';
                break;
            case 'h2':
                isActive = parent && parent.tagName === 'H2';
                break;
            case 'h3':
                isActive = parent && parent.tagName === 'H3';
                break;
            case 'list':
                isActive = document.queryCommandState('insertUnorderedList');
                break;
            case 'quote':
                isActive = parent && parent.tagName === 'BLOCKQUOTE';
                break;
            case 'code':
                isActive = parent && parent.tagName === 'CODE';
                break;
        }
        
        btn.classList.toggle('active', isActive);
    });
}

document.addEventListener('selectionchange', () => {
    const editor = document.getElementById('noteContent');
    if (document.activeElement === editor) {
        updateToolbarState();
    }
});

document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const editor = document.getElementById('noteContent');
        if (!editor) return;
        editor.focus();
        
        if (action === 'clear') {
            document.execCommand('removeFormat', false, null);
            setTimeout(() => {
                updateToolbarState();
                updateCurrentNote();
            }, 10);
            return;
        }
        
        if (action === 'todo') {
            const note = getCurrentNote();
            if (note) {
                addNewTodo(note);
            }
            setTimeout(() => {
                updateToolbarState();
                updateCurrentNote();
            }, 10);
            return;
        }
        
        if (action === 'h1') {
            const isActive = btn.classList.contains('active');
            document.execCommand('formatBlock', false, isActive ? '<p>' : '<h1>');
        } else if (action === 'h2') {
            const isActive = btn.classList.contains('active');
            document.execCommand('formatBlock', false, isActive ? '<p>' : '<h2>');
        } else if (action === 'h3') {
            const isActive = btn.classList.contains('active');
            document.execCommand('formatBlock', false, isActive ? '<p>' : '<h3>');
        } else if (action === 'quote') {
            const isActive = btn.classList.contains('active');
            document.execCommand('formatBlock', false, isActive ? '<p>' : '<blockquote>');
        } else if (action === 'code') {
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                if (selectedText) {
                    document.execCommand('insertHTML', false, `<code>${selectedText}</code>`);
                } else {
                    document.execCommand('insertHTML', false, '<code>код</code>');
                }
            }
        } else if (action === 'list') {
            document.execCommand('insertUnorderedList', false, null);
        } else {
            const commands = {
                'bold': 'bold',
                'italic': 'italic',
                'underline': 'underline',
                'strike': 'strikeThrough'
            };
            if (commands[action]) {
                document.execCommand(commands[action], false, null);
            }
        }
        
        setTimeout(() => {
            updateToolbarState();
            updateCurrentNote();
        }, 10);
    });
});

document.addEventListener('keydown', (e) => {
    const editor = document.getElementById('noteContent');
    if (document.activeElement !== editor) return;
    
    const ctrl = e.ctrlKey || e.metaKey;
    
    if (ctrl && e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
        setTimeout(() => updateToolbarState(), 10);
    } else if (ctrl && e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
        setTimeout(() => updateToolbarState(), 10);
    } else if (ctrl && e.key === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
        setTimeout(() => updateToolbarState(), 10);
    }
});

// ====== НАПОМИНАНИЯ (обработчики) ======
reminderBtn.addEventListener('click', () => {
    const note = getCurrentNote();
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

reminderModalClose.addEventListener('click', () => {
    reminderModal.classList.remove('open');
});

reminderModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        reminderModal.classList.remove('open');
    }
});

setReminderBtn.addEventListener('click', () => {
    const note = getCurrentNote();
    if (!note) return;
    if (!reminderDateTime.value) {
        showToast('Выберите дату и время', 'error');
        return;
    }
    setReminder(note.id, reminderDateTime.value);
    reminderModal.classList.remove('open');
});

removeReminderBtn.addEventListener('click', () => {
    const note = getCurrentNote();
    if (!note) return;
    removeReminder(note.id);
    reminderModal.classList.remove('open');
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

// ====== РЕНДЕР СПИСКА ЗАМЕТОК ======
function renderNotesList() {
    let filtered = notes.filter(n => {
        if (currentFolderId !== null && n.folder !== currentFolderId) return false;
        if (!searchQuery) return true;
        return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               n.content.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (selectedTag && selectedTag !== 'all') {
        filtered = filtered.filter(n => {
            const tags = extractTags(n.content);
            return tags.includes(selectedTag);
        });
    }

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
            const folder = folders.find(f => f.id === currentFolderId);
            emptyDiv.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.4;">📁</div>
                <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 6px;">Папка "${folder?.name || 'Без названия'}" пуста</h3>
                <p style="font-size: 13px; color: var(--text-secondary);">Создайте новую заметку или переместите существующую</p>
                <button onclick="createNewNote()" style="margin-top: 12px; padding: 6px 20px; border: none; border-radius: 8px; background: var(--accent); color: white; cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.2s ease;">➕ Создать заметку</button>
            `;
        } else {
            emptyDiv.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.4;">📝</div>
                <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 6px;">Нет заметок</h3>
                <p style="font-size: 13px; color: var(--text-secondary);">Создайте свою первую заметку</p>
                <button onclick="createNewNote()" style="margin-top: 12px; padding: 6px 20px; border: none; border-radius: 8px; background: var(--accent); color: white; cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.2s ease;">➕ Создать заметку</button>
            `;
        }
        
        notesListEl.appendChild(emptyDiv);
        return;
    }

    sorted.forEach((note) => {
        const div = document.createElement('div');
        div.className = 'note-item' + (note.id === currentNoteId ? ' active' : '');
        div.dataset.noteId = note.id;
        const preview = note.content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').slice(0, 60);
        const tags = extractTags(note.content);
        const tagDisplay = tags.length > 0 ? tags.slice(0, 3).map(t => '#' + t).join(' ') : '';
        const hasReminder = note.reminder && !note.reminder_sent;

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
                    ${note.folder ? `<span>📁 ${folders.find(f => f.id === note.folder)?.name || ''}</span>` : ''}
                </div>
            `;

        div.addEventListener('click', () => {
            if (currentNoteId !== null) updateCurrentNote();
            currentNoteId = note.id;
            loadNoteToEditor(note);
            renderNotesList();
        });

        notesListEl.appendChild(div);
    });
}

// ====== ЗАГРУЗКА ЗАМЕТКИ В РЕДАКТОР ======
function loadNoteToEditor(note) {
    if (!note) {
        noteTitleInput.value = '';
        noteContent.innerHTML = '';
        pinnedImagesContainer.innerHTML = '';
        pinnedVideosContainer.innerHTML = '';
        todoContainer.innerHTML = '';
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
    
    if (!note.images) note.images = [];
    if (!note.videos) note.videos = [];
    if (!note.todo_items) note.todo_items = [];
    
    renderPinnedImages(note);
    renderPinnedVideos(note);
    renderTodoItems(note);
    setTimeout(updateToolbarState, 100);
    updateTagFilterUI();
}

function updateStats() {
    const total = notes.length;
    const pinned = notes.filter(n => n.pinned).length;
    const folderCount = folders.length;
    statsEl.textContent = `${total} заметок${pinned ? `, ${pinned} закреплено` : ''}${folderCount ? `, ${folderCount} папок` : ''}`;
}

function createNewNote() {
    if (currentNoteId !== null) updateCurrentNote();
    const newNote = {
        id: nextId++,
        title: 'Новая заметка',
        content: '',
        pinned: false,
        created: Date.now(),
        updated: Date.now(),
        images: [],
        videos: [],
        folder: currentFolderId,
        reminder: null,
        reminder_sent: false,
        todo_items: []
    };
    notes.unshift(newNote);
    currentNoteId = newNote.id;
    saveNotes();
    loadNoteToEditor(newNote);
    renderNotesList();
    renderFolders();
    updateStats();
    updateTagFilterUI();
    noteTitleInput.focus();
    noteTitleInput.select();
}

function deleteCurrentNote() {
    if (currentNoteId === null) return;
    const note = getCurrentNote();
    if (!note) return;
    if (!confirm(`Удалить заметку "${note.title || 'Без названия'}"?`)) return;

    notes = notes.filter(n => n.id !== currentNoteId);
    saveNotes();

    if (notes.length === 0) {
        currentNoteId = null;
        loadNoteToEditor(null);
    } else {
        currentNoteId = notes[0].id;
        loadNoteToEditor(notes[0]);
    }
    renderNotesList();
    renderFolders();
    updateStats();
    updateTagFilterUI();
}

function togglePin() {
    const note = getCurrentNote();
    if (!note) return;
    note.pinned = !note.pinned;
    note.updated = Date.now();
    saveNotes();
    pinBtn.classList.toggle('active', note.pinned);
    renderNotesList();
}

noteContent.addEventListener('input', () => {
    updateCurrentNote();
});

noteContent.addEventListener('click', () => {
    updateToolbarState();
});

// ====== ОБРАБОТЧИКИ ======
noteTitleInput.addEventListener('input', updateCurrentNote);

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNotesList();
});

newNoteBtn.addEventListener('click', createNewNote);
deleteNoteBtn.addEventListener('click', deleteCurrentNote);
pinBtn.addEventListener('click', togglePin);

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

// ====== ПРОВЕРКА НАПОМИНАНИЙ (каждые 10 секунд) ======
setInterval(checkReminders, 10000);

// ====== ИНИЦИАЛИЗАЦИЯ ======
function init() {
    createBackgroundElements();

    if (customThemeData) {
        applyCustomTheme(customThemeData);
    } else {
        applyTheme(currentTheme);
    }

    renderFolders();
    
    if (notes.length > 0) {
        const firstNote = notes[0];
        currentNoteId = firstNote.id;
        loadNoteToEditor(firstNote);
    } else {
        loadNoteToEditor(null);
    }
    renderNotesList();
    updateStats();
    initRadio();
    updateTagFilterUI();

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    setInterval(() => {
        if (currentNoteId !== null) updateCurrentNote();
    }, 5000);
}

init();