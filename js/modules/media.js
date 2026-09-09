import { getNote, updateNote } from './notes.js';
import { showToast } from './utils.js';

// Получаем ID текущей заметки из глобальной переменной
function getCurrentNoteId() {
    // currentNoteId хранится в app.js как глобальная переменная
    return window.currentNoteId || null;
}

function getCurrentNote() {
    const id = getCurrentNoteId();
    if (id === null) return null;
    return getNote(id);
}

// ====== ФУНКЦИЯ ИЗМЕНЕНИЯ РАЗМЕРА ======
export function startResize(e, element, data) {
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
    };

    const onResizeEnd = () => {
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', onResizeEnd);
        if (window.saveNotes) window.saveNotes();
    };

    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeEnd);
}

// ====== РЕНДЕРИНГ ИЗОБРАЖЕНИЙ ======
export function renderPinnedImages(note) {
    const container = document.getElementById('pinnedImagesContainer');
    if (!container) return;
    container.innerHTML = '';
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
                if (window.saveNotes) window.saveNotes();
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
                    startResize(e, div, imgData);
                }
                return;
            }
            const wrapperRect = document.getElementById('noteContentWrapper').getBoundingClientRect();
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
                if (window.saveNotes) window.saveNotes();
            }
            dragData = null;
            document.removeEventListener('mousemove', imgDragMove);
            document.removeEventListener('mouseup', imgDragEnd);
        };

        container.appendChild(div);
    });
}

// ====== РЕНДЕРИНГ ВИДЕО ======
export function renderPinnedVideos(note) {
    const container = document.getElementById('pinnedVideosContainer');
    if (!container) return;
    container.innerHTML = '';
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
                if (window.saveNotes) window.saveNotes();
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
                    startResize(e, div, videoData);
                }
                return;
            }
            const wrapperRect = document.getElementById('noteContentWrapper').getBoundingClientRect();
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
                if (window.saveNotes) window.saveNotes();
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

        container.appendChild(div);
    });
}

// ====== ИНИЦИАЛИЗАЦИЯ КНОПОК ======
export function initMediaButtons() {
    const imageBtn = document.getElementById('imageBtn');
    const videoBtn = document.getElementById('videoBtn');

    if (imageBtn) {
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
                            const wrapper = document.getElementById('noteContentWrapper');
                            const wrapperWidth = wrapper.clientWidth || 500;
                            const wrapperHeight = wrapper.clientHeight || 300;
                            note.images.push({
                                src: ev.target.result,
                                x: Math.random() * (wrapperWidth - w - 20),
                                y: Math.random() * (wrapperHeight - h - 20),
                                width: w,
                                height: h
                            });
                            if (window.saveNotes) window.saveNotes();
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
    }

    if (videoBtn) {
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
                            const wrapper = document.getElementById('noteContentWrapper');
                            const wrapperWidth = wrapper.clientWidth || 500;
                            const wrapperHeight = wrapper.clientHeight || 300;
                            note.videos.push({
                                src: ev.target.result,
                                x: Math.random() * (wrapperWidth - w - 20),
                                y: Math.random() * (wrapperHeight - h - 20),
                                width: Math.max(100, w),
                                height: Math.max(70, h)
                            });
                            if (window.saveNotes) window.saveNotes();
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
    }
}