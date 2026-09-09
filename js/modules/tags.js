import { extractTags } from './utils.js';
import { getNotes } from './notes.js';

let selectedTag = 'all';

export function getSelectedTag() {
    return selectedTag;
}

export function setSelectedTag(tag) {
    selectedTag = tag;
}

export function getAllTags() {
    const notes = getNotes();
    const allTags = new Set();
    notes.forEach(note => {
        const tags = extractTags(note.content);
        tags.forEach(t => allTags.add(t));
    });
    return allTags;
}

export function filterNotesByTag(notes, tag) {
    if (tag === 'all') return notes;
    return notes.filter(n => {
        const tags = extractTags(n.content);
        return tags.includes(tag);
    });
}

export function updateTagFilterUI(tagFilterSelected, tagFilterOptions) {
    const allTags = getAllTags();
    const currentValue = selectedTag;
    tagFilterOptions.innerHTML = '';
    
    const allOption = document.createElement('div');
    allOption.className = 'option' + (currentValue === 'all' ? ' active' : '');
    allOption.textContent = '📋 Все теги';
    allOption.dataset.value = 'all';
    tagFilterOptions.appendChild(allOption);
    
    allTags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'option' + (tag === currentValue ? ' active' : '');
        option.textContent = '#' + tag;
        option.dataset.value = tag;
        tagFilterOptions.appendChild(option);
    });
    
    tagFilterSelected.textContent = currentValue === 'all' ? '📋 Все теги' : '#' + currentValue;
}