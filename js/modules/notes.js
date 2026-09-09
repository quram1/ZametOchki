import { loadNotes, saveNotes } from './storage.js';
import { showToast } from './utils.js';

let notes = loadNotes();
let nextId = Math.max(0, ...notes.map(n => n.id)) + 1;

export function getNotes() {
    return notes;
}

export function setNotes(newNotes) {
    notes = newNotes;
    saveNotes(notes);
}

export function getNote(id) {
    return notes.find(n => n.id === id) || null;
}

export function getCurrentNote(currentNoteId) {
    return getNote(currentNoteId);
}

export function createNote(data = {}) {
    const newNote = {
        id: nextId++,
        title: data.title || 'Новая заметка',
        content: data.content || '',
        pinned: data.pinned || false,
        created: Date.now(),
        updated: Date.now(),
        images: data.images || [],
        videos: data.videos || [],
        folder: data.folder || null,
        reminder: data.reminder || null,
        reminder_sent: false,
        todo_items: data.todo_items || []
    };
    notes.unshift(newNote);
    saveNotes(notes);
    return newNote;
}

export function updateNote(id, data) {
    const note = getNote(id);
    if (!note) return null;
    Object.assign(note, data);
    note.updated = Date.now();
    saveNotes(notes);
    return note;
}

export function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes(notes);
}

export function togglePin(id) {
    const note = getNote(id);
    if (!note) return null;
    note.pinned = !note.pinned;
    note.updated = Date.now();
    saveNotes(notes);
    return note;
}

export function getNextId() {
    return nextId;
}

export function setNextId(id) {
    nextId = id;
}