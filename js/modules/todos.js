import { getNote, updateNote } from './notes.js';

// ====== РЕНДЕРИНГ ЧЕК-ЛИСТОВ ======
export function renderTodoItems(note) {
    const container = document.getElementById('todoContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!note || !note.todo_items || note.todo_items.length === 0) return;
    
    note.todo_items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'todo-item' + (item.checked ? ' checked' : '');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.checked;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleTodoItem(note.id, index);
        });
        const text = document.createElement('span');
        text.textContent = item.text;
        const remove = document.createElement('button');
        remove.textContent = '✕';
        remove.className = 'todo-remove';
        remove.addEventListener('click', (e) => {
            e.stopPropagation();
            removeTodoItem(note.id, index);
        });
        div.appendChild(checkbox);
        div.appendChild(text);
        div.appendChild(remove);
        container.appendChild(div);
    });
}

export function toggleTodoItem(noteId, todoIndex) {
    const note = getNote(noteId);
    if (!note || !note.todo_items) return;
    note.todo_items[todoIndex].checked = !note.todo_items[todoIndex].checked;
    updateNote(noteId, { todo_items: note.todo_items });
    renderTodoItems(note);
    if (window.renderNotesList) window.renderNotesList();
}

export function removeTodoItem(noteId, todoIndex) {
    const note = getNote(noteId);
    if (!note || !note.todo_items) return;
    note.todo_items.splice(todoIndex, 1);
    updateNote(noteId, { todo_items: note.todo_items });
    renderTodoItems(note);
    if (window.renderNotesList) window.renderNotesList();
}

export function addTodoItem(noteId, text) {
    const note = getNote(noteId);
    if (!note) return;
    if (!note.todo_items) note.todo_items = [];
    note.todo_items.push({ text, checked: false });
    updateNote(noteId, { todo_items: note.todo_items });
    renderTodoItems(note);
}