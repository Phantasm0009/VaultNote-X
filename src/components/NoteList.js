import React from 'react';

const NoteList = ({ notes, selectedNote, onSelectNote, onCreateNote, onDeleteNote }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };
    
    return (
        <div className="note-list">
            <div className="note-list-header">
                <h2>Your Notes</h2>
                <button 
                    className="btn btn-sm btn-primary" 
                    onClick={onCreateNote}
                    title="Create new note"
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>
            
            <div className="note-list-content">
                {notes.length === 0 ? (
                    <div className="empty-state">
                        <i className="far fa-folder-open"></i>
                        <p>No notes yet</p>
                        <button 
                            className="btn btn-primary btn-sm mt-2"
                            onClick={onCreateNote}
                        >
                            Create first note
                        </button>
                    </div>
                ) : (
                    <ul>
                        {notes.map((note) => (
                            <li 
                                key={note.id} 
                                onClick={() => onSelectNote(note)}
                                className={selectedNote && selectedNote.id === note.id ? 'active' : ''}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (window.confirm(`Delete "${note.title}"?`)) {
                                        onDeleteNote(note.id);
                                    }
                                }}
                                title="Right-click to delete"
                            >
                                <h3>{note.title}</h3>
                                <p>
                                    {note.isEncrypted && <i className="fas fa-lock note-encrypted"></i>}
                                    <span>{formatDate(note.lastModified)}</span>
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NoteList;