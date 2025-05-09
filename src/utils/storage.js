import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vaultnote-x-notes';

export const saveNotes = (notes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const getNotes = () => {
    const notes = localStorage.getItem(STORAGE_KEY);
    return notes ? JSON.parse(notes) : [];
};

export const clearNotes = () => {
    localStorage.removeItem(STORAGE_KEY);
};

// Add the missing functions
export const saveNote = (noteId, noteData) => {
    const notes = getNotes();
    const timestamp = new Date().toISOString();
    
    if (noteId) {
        // Update existing note
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = { 
                ...notes[noteIndex], 
                ...noteData, 
                lastModified: timestamp 
            };
        }
    } else {
        // Create new note with unique ID
        const newNote = {
            id: Date.now().toString(),
            title: noteData.title || 'Untitled Note',
            content: noteData.content,
            isEncrypted: noteData.isEncrypted || false,
            created: timestamp,
            lastModified: timestamp
        };
        notes.push(newNote);
    }
    
    saveNotes(notes);
    return noteId || notes[notes.length - 1].id;
};

export const getNote = (noteId) => {
    const notes = getNotes();
    return notes.find(note => note.id === noteId);
};

export const useNotesStorage = () => {
    const [notes, setNotes] = useState(getNotes());

    useEffect(() => {
        saveNotes(notes);
    }, [notes]);

    return [notes, setNotes];
};