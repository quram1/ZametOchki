import { getNotes, updateNote } from './notes.js';
import { showToast } from './utils.js';

export function checkReminders() {
    const notes = getNotes();
    const now = Date.now();
    notes.forEach(note => {
        if (note.reminder && note.reminder <= now && !note.reminder_sent) {
            note.reminder_sent = true;
            updateNote(note.id, { reminder_sent: true });
            showToast(`⏰ Напоминание: "${note.title || 'Без названия'}"`, 'info');
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('ЗаметОчки', {
                    body: `Напоминание: ${note.title || 'Без названия'}`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📝</text></svg>'
                });
            }
        }
    });
}

export function setReminder(noteId, dateTime) {
    const timestamp = new Date(dateTime).getTime();
    updateNote(noteId, { reminder: timestamp, reminder_sent: false });
    showToast('⏰ Напоминание установлено!', 'success');
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

export function removeReminder(noteId) {
    updateNote(noteId, { reminder: null, reminder_sent: false });
    showToast('Напоминание удалено', 'info');
}