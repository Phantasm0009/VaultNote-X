import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import NoteList from './components/NoteList';
import VersionHistory from './components/VersionHistory';
import EncryptionSetup from './components/EncryptionSetup';
import PassphraseModal from './components/PassphraseModal';
import Header from './components/Header';
import AccessLogs from './components/AccessLogs';
import useLocalStorage from './hooks/useLocalStorage';
import useEncryption from './hooks/useEncryption';
import { getVersions } from './utils/versionControl';
import { logNoteAccess } from './utils/accessLogs';
import { useTheme } from './hooks/useTheme';

const App = () => {
    // Initialize theme (this will automatically apply the saved/preferred theme)
    useTheme();

    const [notes, setNotes] = useLocalStorage('vaultnote-notes', []);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isEncryptionSetup, setIsEncryptionSetup] = useState(false);
    const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
    const [versions, setVersions] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [logNoteId, setLogNoteId] = useState(null);
    const [logNoteName, setLogNoteName] = useState('');
    const encryption = useEncryption();

    // Check if encryption setup was previously completed
    useEffect(() => {
        const encryptionStatus = localStorage.getItem('encryption-setup');
        if (encryptionStatus === 'completed') {
            setIsEncryptionSetup(true);
        }
    }, []);

    // Add a useEffect to check for remembered encryption on initial load
    // Try to auto-unlock if there's a remembered passphrase
    useEffect(() => {
        if (encryption.hasRememberedEncryption() && !encryption.key) {
            // Check if we should show a "remembered device" prompt
            console.log("Found remembered encryption settings");
            // Instead of auto-prompting, we can show a UI indicator that there's a saved passphrase
            // The user can click the security button to enter it
        }
    }, [encryption]);

    // Add this useEffect to detect encrypted notes that need unlocking
    useEffect(() => {
        // When selecting an encrypted note, check if we need to handle encryption
        if (selectedNote && selectedNote.isEncrypted && !encryption.key) {
            console.log('Selected encrypted note without encryption key - should prompt for passphrase');
            // The Editor component will handle showing the unlock modal
        }
    }, [selectedNote]);

    // Load versions when a note is selected
    useEffect(() => {
        if (selectedNote) {
            const noteVersions = getVersions(selectedNote.id) || [];
            setVersions(noteVersions);
        }
    }, [selectedNote]);

    const handleNoteSelect = (note) => {
        // Before setting the note, check if it's encrypted and we need a passphrase
        const needsPassphrase = note.isEncrypted && !encryption.key;
        
        setSelectedNote(note);
        
        // If the note is encrypted and we don't have a key, show the passphrase modal
        if (needsPassphrase) {
            console.log('Selected encrypted note without encryption key - prompting for passphrase');
            setTimeout(() => setIsPassphraseModalOpen(true), 200);
        }
        
        // Reset any loaded versions when switching notes
        if (note.id !== selectedNote?.id) {
            setVersions([]);
            
            // Load new versions for the selected note
            const noteVersions = getVersions(note.id) || [];
            setVersions(noteVersions);
        }
    };

    const handleCreateNote = () => {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            isEncrypted: false,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
        
        // Log note creation
        logNoteAccess(newNote.id, 'created');
    };

    const handleDeleteNote = (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const updatedNotes = notes.filter(note => note.id !== noteId);
            setNotes(updatedNotes);
            
            if (selectedNote && selectedNote.id === noteId) {
                setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
            }
        }
    };

    const handleEncryptionSetup = () => {
        setIsEncryptionSetup(true);
        localStorage.setItem('encryption-setup', 'completed');
    };

    const handlePassphraseSubmit = (passphrase, remember = false) => {
        if (!passphrase) {
            console.error("Passphrase is required");
            return;
        }
        
        try {
            const key = encryption.generateKey(passphrase, remember);
            setIsPassphraseModalOpen(false);
            
            if (!key) {
                console.error("Failed to set encryption key");
                alert("Failed to set up encryption key. Please try again.");
                return;
            }
            
            // If there's a selected note that's encrypted but locked, try to decrypt it now
            if (selectedNote && selectedNote.isEncrypted) {
                try {
                    // Force a re-render of the Editor component by changing its key
                    setSelectedNote({
                        ...selectedNote,
                        _refreshKey: Date.now() // Add a refresh key to force re-render
                    });
                } catch (error) {
                    console.error("Failed to decrypt note after passphrase entry", error);
                }
            }
            
            console.log(`Encryption key ${remember ? 'set with remember option' : 'set for this session only'}`);
        } catch (error) {
            console.error("Error in handlePassphraseSubmit:", error);
            alert("There was a problem setting up encryption. Please try again.");
        }
    };

    const handleShowLogs = (noteId, noteName) => {
        setLogNoteId(noteId);
        setLogNoteName(noteName);
        setShowLogs(true);
    };

    const AccessLogsModal = () => (
        <div className="modal">
            <div className="modal-content logs-modal">
                <div className="modal-header">
                    <h2><i className="fas fa-clock-rotate-left"></i> Access Logs</h2>
                    <button 
                        className="close-button"
                        onClick={() => setShowLogs(false)}
                        aria-label="Close"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body">
                    <AccessLogs noteId={logNoteId} noteName={logNoteName} />
                </div>
                <div className="modal-footer">
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowLogs(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            <Header 
                onNewNote={handleCreateNote}
                onSetPassphrase={() => setIsPassphraseModalOpen(true)}
                isEncryptionLocked={!encryption.key || encryption.isLocked}
            />
            
            <div className="container">
                {!isEncryptionSetup ? (
                    <EncryptionSetup onComplete={handleEncryptionSetup} />
                ) : (
                    <div className="app-grid">
                        <div className="sidebar">
                            <NoteList 
                                notes={notes} 
                                selectedNote={selectedNote}
                                onSelectNote={handleNoteSelect} 
                                onCreateNote={handleCreateNote}
                                onDeleteNote={handleDeleteNote}
                            />
                        </div>
                        
                        <div className="main-content">
                            {selectedNote ? (
                                <Editor 
                                    key={selectedNote.id}
                                    noteId={selectedNote.id} 
                                    initialTitle={selectedNote.title}
                                    initialContent={selectedNote.content}
                                    isEncrypted={selectedNote.isEncrypted}
                                    encryption={encryption}
                                    onShowLogs={handleShowLogs}
                                    onSave={(updatedNote) => {
                                        const updatedNotes = notes.map(note => 
                                            note.id === selectedNote.id ? {...note, ...updatedNote} : note
                                        );
                                        setNotes(updatedNotes);
                                        setSelectedNote({...selectedNote, ...updatedNote});
                                    }}
                                    onDelete={() => handleDeleteNote(selectedNote.id)}
                                />
                            ) : (
                                <div className="card empty-state">
                                    <div>
                                        <i className="far fa-sticky-note"></i>
                                        <h2>No Note Selected</h2>
                                        <p>Select a note from the list or create a new one</p>
                                        <button 
                                            className="btn btn-primary mt-3"
                                            onClick={handleCreateNote}
                                        >
                                            <i className="fas fa-plus"></i> Create New Note
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="sidebar-right">
                            {selectedNote && (
                                <VersionHistory 
                                    versions={versions}
                                    currentContent={selectedNote.content}
                                    isEncrypted={selectedNote.isEncrypted}
                                    onRestore={(version) => {
                                        // Handle version restore
                                        const updatedNote = {
                                            ...selectedNote,
                                            content: version.content,
                                            lastModified: new Date().toISOString()
                                        };
                                        
                                        const updatedNotes = notes.map(note => 
                                            note.id === selectedNote.id ? updatedNote : note
                                        );
                                        
                                        setNotes(updatedNotes);
                                        setSelectedNote(updatedNote);
                                    }} 
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <PassphraseModal 
                isOpen={isPassphraseModalOpen} 
                onClose={() => setIsPassphraseModalOpen(false)} 
                onSubmit={handlePassphraseSubmit} 
            />
            
            {showLogs && <AccessLogsModal />}
        </div>
    );
};

export default App;