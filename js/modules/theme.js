import { loadTheme, saveTheme, loadCustomTheme, saveCustomTheme, removeCustomTheme } from './storage.js';

let currentTheme = loadTheme();
let customThemeData = loadCustomTheme();

export function getCurrentTheme() {
    return currentTheme;
}

export function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    currentTheme = theme;
    saveTheme(theme);

    document.querySelectorAll('#themeToggle button[data-theme]').forEach(btn => {
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

export function applyCustomTheme(data) {
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
    saveTheme('custom');
    saveCustomTheme(data);

    document.querySelectorAll('#themeToggle button[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === 'custom');
    });

    document.querySelectorAll('.leaf, .wave-emoji, .sun-emoji, .star').forEach(el => {
        el.style.display = 'none';
    });
}

export function loadAndApplyTheme() {
    if (customThemeData) {
        applyCustomTheme(customThemeData);
    } else {
        applyTheme(currentTheme);
    }
}

export function resetCustomTheme() {
    removeCustomTheme();
    customThemeData = null;
    applyTheme('dark');
}

// ====== ФОНОВЫЕ ЭЛЕМЕНТЫ ======
export function createBackgroundElements(theme) {
    // Удаляем старые элементы
    document.querySelectorAll('.leaf, .wave-emoji, .sun-emoji, .star').forEach(el => el.remove());

    // ===== ЛИСТЬЯ ДЛЯ ЛЕСА =====
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
        el.style.display = theme === 'forest' ? 'block' : 'none';
        // Добавляем will-change для производительности
        el.style.willChange = 'transform, opacity';
        el.style.transform = 'translateZ(0)';
        document.body.appendChild(el);
    });

    // ===== ВОЛНЫ ДЛЯ ОКЕАНА =====
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
        el.style.display = theme === 'ocean' ? 'block' : 'none';
        el.style.willChange = 'transform, opacity';
        el.style.transform = 'translateZ(0)';
        document.body.appendChild(el);
    });

    // ===== СОЛНЦЕ ДЛЯ ЗАКАТА =====
    const sun = document.createElement('div');
    sun.className = 'sun-emoji';
    sun.textContent = '☀️';
    sun.style.display = theme === 'sunset' ? 'block' : 'none';
    sun.style.willChange = 'transform, opacity';
    sun.style.transform = 'translateZ(0)';
    document.body.appendChild(sun);

    // ===== ЗВЁЗДЫ ДЛЯ ТЁМНОЙ ТЕМЫ =====
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
        el.style.display = theme === 'dark' ? 'block' : 'none';
        el.style.willChange = 'transform, opacity';
        el.style.transform = 'translateZ(0)';
        document.body.appendChild(el);
    });
}