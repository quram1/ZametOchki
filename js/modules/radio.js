import { TRACKS } from './types.js';
import { showToast } from './utils.js';

let audio = null;
let isPlaying = false;
let currentTrackIndex = 0;
let isCollapsed = false;

// DOM элементы (будут установлены при инициализации)
let radioWidget, radioPlayBtn, radioPrevBtn, radioNextBtn, radioVolume, volumeLabel, nowPlaying, collapseBtn;

export function initRadio() {
    // Получаем DOM элементы
    radioWidget = document.getElementById('radioWidget');
    radioPlayBtn = document.getElementById('radioPlayBtn');
    radioPrevBtn = document.getElementById('radioPrevBtn');
    radioNextBtn = document.getElementById('radioNextBtn');
    radioVolume = document.getElementById('radioVolume');
    volumeLabel = document.getElementById('volumeLabel');
    nowPlaying = document.getElementById('nowPlaying');
    collapseBtn = document.getElementById('collapseBtn');

    audio = new Audio();
    audio.volume = radioVolume.value / 100;
    audio.addEventListener('ended', () => { playNext(); });
    audio.addEventListener('error', () => {
        nowPlaying.textContent = '❌ Ошибка загрузки';
        radioPlayBtn.textContent = '▶';
        isPlaying = false;
        showToast('❌ Не удалось загрузить трек, попробуйте другой', 'error');
    });
    loadTrack(currentTrackIndex);
    audio.load();

    // Навешиваем обработчики
    radioPlayBtn.addEventListener('click', togglePlay);
    radioPrevBtn.addEventListener('click', playPrev);
    radioNextBtn.addEventListener('click', playNext);
    radioVolume.addEventListener('input', onVolumeChange);
    collapseBtn.addEventListener('click', onCollapse);
}

function loadTrack(index) {
    currentTrackIndex = index;
    const track = TRACKS[index];
    audio.src = track.url;
    nowPlaying.textContent = track.title;
    if (isPlaying) {
        audio.play().catch(() => {
            nowPlaying.textContent = '❌ Ошибка загрузки';
            radioPlayBtn.textContent = '▶';
            isPlaying = false;
            showToast('❌ Не удалось загрузить трек', 'error');
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
            nowPlaying.textContent = '❌ Ошибка загрузки';
            radioPlayBtn.textContent = '▶';
            isPlaying = false;
            showToast('❌ Не удалось загрузить трек', 'error');
        });
        radioPlayBtn.textContent = '⏸';
    }
    isPlaying = !isPlaying;
}

function playNext() {
    currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audio.play().catch(() => {
            nowPlaying.textContent = '❌ Ошибка загрузки';
            radioPlayBtn.textContent = '▶';
            isPlaying = false;
            showToast('❌ Не удалось загрузить трек', 'error');
        });
    }
}

function playPrev() {
    currentTrackIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audio.play().catch(() => {
            nowPlaying.textContent = '❌ Ошибка загрузки';
            radioPlayBtn.textContent = '▶';
            isPlaying = false;
            showToast('❌ Не удалось загрузить трек', 'error');
        });
    }
}

function onVolumeChange() {
    if (audio) {
        audio.volume = radioVolume.value / 100;
        volumeLabel.textContent = radioVolume.value + '%';
    }
}

function onCollapse(e) {
    e.stopPropagation();
    isCollapsed = !isCollapsed;
    radioWidget.classList.toggle('collapsed', isCollapsed);
    collapseBtn.textContent = isCollapsed ? '+' : '−';
}

// Перетаскивание радио (вызывается извне)
export function setupRadioDrag(radioDragHandle) {
    let dragData = null;
    
    const startDrag = (e) => {
        if (e.target.closest('.collapse-btn')) return;
        const rect = radioWidget.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        dragData = {
            startX: clientX,
            startY: clientY,
            rect: rect
        };
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onTouchDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
        e.preventDefault();
    };

    const onDragMove = (e) => {
        if (!dragData) return;
        const dx = e.clientX - dragData.startX;
        const dy = e.clientY - dragData.startY;
        radioWidget.style.right = 'auto';
        radioWidget.style.bottom = 'auto';
        radioWidget.style.left = (dragData.rect.left + dx) + 'px';
        radioWidget.style.top = (dragData.rect.top + dy) + 'px';
    };

    const onTouchDragMove = (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        onDragMove(mouseEvent);
        e.preventDefault();
    };

    const onDragEnd = () => {
        dragData = null;
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onTouchDragMove);
        document.removeEventListener('touchend', onDragEnd);
    };

    radioDragHandle.addEventListener('mousedown', startDrag);
    radioDragHandle.addEventListener('touchstart', startDrag);
}

export function getRadioState() {
    return { isPlaying, currentTrackIndex, isCollapsed };
}