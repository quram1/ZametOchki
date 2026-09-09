import { getCurrentNote, updateNote } from './notes.js';
import { showToast } from './utils.js';

// ====== ПАНЕЛЬ ИНСТРУМЕНТОВ ======
export function updateToolbarState() {
    const editor = document.getElementById('noteContent');
    if (!editor) return;
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parent = container.nodeType === 3 ? container.parentElement : container;
    
    const btnActions = ['bold', 'italic', 'underline', 'strike', 'h1', 'h2', 'h3', 'list', 'todo', 'quote', 'code'];
    
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
            case 'todo':
                isActive = parent && parent.closest('.todo-item') !== null;
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

export function initEditor() {
    const editor = document.getElementById('noteContent');
    if (!editor) return;

    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) {
            updateToolbarState();
        }
    });

    // Обработчики кнопок
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
                    if (window.updateCurrentNote) window.updateCurrentNote();
                }, 10);
                return;
            }
            
            if (action === 'todo') {
                // Вставка чек-листа
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString() || 'Новая задача';
                    const todoDiv = document.createElement('div');
                    todoDiv.className = 'todo-item';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    const span = document.createElement('span');
                    span.textContent = selectedText;
                    todoDiv.appendChild(checkbox);
                    todoDiv.appendChild(span);
                    
                    const note = window.getCurrentNote ? window.getCurrentNote() : null;
                    if (note) {
                        if (!note.todo_items) note.todo_items = [];
                        note.todo_items.push({ text: selectedText, checked: false });
                        note.updated = Date.now();
                        if (window.saveNotes) window.saveNotes();
                        if (window.renderTodoItems) window.renderTodoItems(note);
                        if (window.renderNotesList) window.renderNotesList();
                        document.execCommand('insertHTML', false, todoDiv.outerHTML);
                        if (selectedText) {
                            range.deleteContents();
                        }
                        if (window.updateCurrentNote) window.updateCurrentNote();
                    }
                }
                setTimeout(() => {
                    updateToolbarState();
                    if (window.updateCurrentNote) window.updateCurrentNote();
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
                if (window.updateCurrentNote) window.updateCurrentNote();
            }, 10);
        });
    });

    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
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
}