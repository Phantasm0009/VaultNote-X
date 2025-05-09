import React, { useState, useEffect, useRef } from 'react';
import { saveVersion } from '../utils/versionControl';
import { renderMarkdown } from '../utils/markdownParser';
import CryptoJS from 'crypto-js';
import PassphraseModal from './PassphraseModal';
import { encrypt, decrypt, isCorrectPassphrase } from '../utils/simpleEncryption';
import useDebounce from '../hooks/useDebounce';
import { logNoteAccess } from '../utils/accessLogs';

const Editor = ({ 
    noteId, 
    initialTitle = 'Untitled Note', 
    initialContent = '',
    isEncrypted = false,
    encryption,
    onSave,
    onDelete,
    onShowLogs  // Add this new prop
}) => {
    // All state and ref declarations at the top level
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState('');
    const [encrypted, setEncrypted] = useState(isEncrypted);
    const [saveStatus, setSaveStatus] = useState('');
    const [autoSaveTimer, setAutoSaveTimer] = useState(null);
    const [isLocked, setIsLocked] = useState(isEncrypted);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [unlockError, setUnlockError] = useState('');
    const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
    const [lastVersionTime, setLastVersionTime] = useState(Date.now());
    const [lastContent, setLastContent] = useState('');
    const [rememberPassphrase, setRememberPassphrase] = useState(false);
    const [showPassphraseModal, setShowPassphraseModal] = useState(false);
    const [showCommitModal, setShowCommitModal] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [initialDecryptAttempted, setInitialDecryptAttempted] = useState(false);

    const textAreaRef = useRef(null);
    const isMountedRef = useRef(true);
    const modalShownRef = useRef(false);

    // Debounced content for version history
    let debouncedContent;
    try {
        // Directly use the hook result if available
        debouncedContent = useDebounce(content, 800);
    } catch (e) {
        console.warn('useDebounce hook failed, using non-debounced content', e);
        debouncedContent = content; // Fallback to non-debounced content
    }

    const decryptWithFallbacks = (encryptedContent, key) => {
        if (!encryptedContent || !key) return null;       
  
        console.log("Attempting decryption with fallbacks...");
        
        // Try multiple decryption approaches in case format has changed
        try {
            // Try using the CryptoJS library directly with multiple configurations
            const CryptoJS = require('crypto-js');
            
            // Standard AES decryption 
            try {
                console.log("Trying standard AES...");
                const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                if (decrypted && decrypted.length > 0) return decrypted;
            } catch (e) {
                console.warn("Standard AES failed:", e.message);
            }
            
            // Try to parse as JSON (for enhanced encryption)
            try {
                console.log("Trying JSON format...");
                const jsonData = JSON.parse(encryptedContent);
                if (jsonData.salt && jsonData.data) {
                    const derivedKey = CryptoJS.PBKDF2(key, jsonData.salt, {
                        keySize: 256/32,
                        iterations: 1000
                    });
                    const bytes = CryptoJS.AES.decrypt(jsonData.data, derivedKey.toString());
                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                    if (decrypted && decrypted.length > 0) return decrypted;
                }
            } catch (e) {
                console.warn("JSON format failed:", e.message);
            }
            
            // Try different modes and configurations
            const configs = [
                { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
                { mode: CryptoJS.mode.CFB, padding: CryptoJS.pad.Pkcs7 },
                { mode: CryptoJS.mode.OFB, padding: CryptoJS.pad.Pkcs7 },
                { mode: CryptoJS.mode.CTR, padding: CryptoJS.pad.Pkcs7 }
            ];
            
            for (const config of configs) {
                try {
                    console.log(`Trying ${config.mode}...`);
                    const bytes = CryptoJS.AES.decrypt(encryptedContent, key, config);
                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                    if (decrypted && decrypted.length > 0) return decrypted;
                } catch (e) {
                    console.warn(`${config.mode} failed:`, e.message);
                }
                
                try {
                    // Also try with parsed key
                    const parsedKey = CryptoJS.enc.Utf8.parse(key);
                    const bytes = CryptoJS.AES.decrypt(encryptedContent, parsedKey, config);
                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                    if (decrypted && decrypted.length > 0) return decrypted;
                } catch (e) {
                    console.warn(`${config.mode} with parsed key failed:`, e.message);
                }
            }
            
            // Last resort: Try Base64 decoding if it looks like Base64
            if (/^[A-Za-z0-9+/=]+$/.test(encryptedContent)) {
                try {
                    const decoded = atob(encryptedContent);
                    if (decoded && decoded.length > 0 && /[\x20-\x7E]/.test(decoded)) {
                        return decoded;
                    }
                } catch (e) {
                    console.warn("Base64 decode failed:", e.message);
                }
            }
        } catch (error) {
            console.error("Decryption fallback error:", error);
        }
        
        return null;
    };

    // Add this effect to handle mounting/unmounting
    useEffect(() => {
        // Set to mounted
        isMountedRef.current = true;
        modalShownRef.current = false;
        
        // Cleanup when unmounting
        return () => {
            isMountedRef.current = false;
            modalShownRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (noteId) {
            logNoteAccess(noteId, 'viewed');
        }
    }, [noteId]);

    useEffect(() => {
        setTitle(initialTitle);
        setEncrypted(isEncrypted);
        
        // Handle content
        if (!initialContent) {
            setContent('');
            setIsLocked(false);
            setLastContent('');
            return;
        }
        
        // If it's encrypted, always check and show the unlock modal if needed
        if (isEncrypted) {
            // ALWAYS set locked state first for encrypted notes
            setIsLocked(true);
            
            // Only try to auto-decrypt if we have an encryption key
            if (encryption.key) {
                try {
                    console.log("Attempting to decrypt note with stored key");
                    const decryptedContent = encryption.decryptNote(initialContent);
                    
                    if (decryptedContent) {
                        console.log("Successfully decrypted note content with stored key");
                        setContent(decryptedContent);
                        setLastContent(decryptedContent);
                        setIsLocked(false);
                    } else {
                        console.warn("Auto-decryption failed - showing unlock modal");
                        setTimeout(() => setShowUnlockModal(true), 100);
                    }
                } catch (error) {
                    console.error("Failed to decrypt note:", error);
                    setTimeout(() => setShowUnlockModal(true), 100);
                }
            } else {
                console.log("No encryption key available - showing unlock modal");
                setTimeout(() => setShowUnlockModal(true), 100);
            }
        } else {
            // Not encrypted, just set the content
            setContent(initialContent);
            setLastContent(initialContent);
            setIsLocked(false);
        }
    }, [noteId, initialTitle, initialContent, isEncrypted, encryption]);

    // Replace the useEffect that handles showing the unlock modal
    useEffect(() => {
        // Only run this effect when note ID or encryption status changes
        if (isEncrypted) {
            // Always set the initial locked state for encrypted notes
            setIsLocked(true);
            
            // Only try to decrypt if we haven't already attempted it for this note
            if (!initialDecryptAttempted) {
                setInitialDecryptAttempted(true);
                
                // If we have a key, try to decrypt automatically
                if (encryption.key) {
                    try {
                        console.log("Attempting to decrypt note with stored key");
                        
                        // Try to decrypt directly with our simple method
                        if (isCorrectPassphrase(initialContent, encryption.key)) {
                            const decryptedContent = decrypt(initialContent, encryption.key);
                            
                            if (decryptedContent) {
                                console.log("Successfully decrypted note content");
                                setContent(decryptedContent);
                                setLastContent(decryptedContent);
                                setIsLocked(false);
                            } else {
                                console.log("Auto-decryption failed - showing unlock modal");
                                
                                // Show the unlock modal only if it hasn't been shown yet
                                if (!modalShownRef.current) {
                                    modalShownRef.current = true;
                                    setTimeout(() => {
                                        if (isMountedRef.current) {
                                            setShowUnlockModal(true);
                                        }
                                    }, 300);
                                }
                            }
                        } else {
                            console.log("Passphrase verification failed - showing unlock modal");
                            
                            // Show the unlock modal only if it hasn't been shown yet
                            if (!modalShownRef.current) {
                                modalShownRef.current = true;
                                setTimeout(() => {
                                    if (isMountedRef.current) {
                                        setShowUnlockModal(true);
                                    }
                                }, 300);
                            }
                        }
                    } catch (error) {
                        console.error("Failed to decrypt note:", error);
                        
                        // Show the unlock modal only if it hasn't been shown yet
                        if (!modalShownRef.current) {
                            modalShownRef.current = true;
                            setTimeout(() => {
                                if (isMountedRef.current) {
                                    setShowUnlockModal(true);
                                }
                            }, 300);
                        }
                    }
                } else {
                    console.log("No encryption key available - showing unlock modal");
                    
                    // Show the unlock modal only if it hasn't been shown yet
                    if (!modalShownRef.current) {
                        modalShownRef.current = true;
                        setTimeout(() => {
                            if (isMountedRef.current) {
                                setShowUnlockModal(true);
                            }
                        }, 300);
                    }
                }
            }
        } else {
            // Not encrypted, reset states
            setIsLocked(false);
            setContent(initialContent);
            setLastContent(initialContent);
            setInitialDecryptAttempted(false);
            modalShownRef.current = false;
        }
        
        return () => {
            // Reset the flag when note changes
            modalShownRef.current = false;
        };
    }, [noteId, isEncrypted, initialContent, encryption.key, initialDecryptAttempted]);

    // Add a cleanup effect to reset the flag when note changes
    useEffect(() => {
        // Reset the flag when note changes
        return () => {
            setInitialDecryptAttempted(false);
        };
    }, [noteId]);

    useEffect(() => {
        // Focus on textarea when a note is selected and not locked
        if (!isLocked) {
            // Delay focusing to prevent issues with modals
            setTimeout(() => {
                // Check both mounted state and ref existence
                if (isMountedRef.current && textAreaRef.current) {
                    try {
                        textAreaRef.current.focus();
                    } catch (e) {
                        console.log("Focus error:", e);
                    }
                }
            }, 200);
        }
        
        // Cancel any existing auto-save timers when unmounting
        return () => {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
        };
    }, [noteId, isLocked]);

    useEffect(() => {
        // Only save when the user has explicitly clicked the "Save" or "Commit" buttons
        // We'll remove the automatic popup trigger here
        if (debouncedContent && debouncedContent !== lastContent) {
            setSaveStatus('editing');
            // Do not auto-save or show popups here - require explicit user action
        }
    }, [debouncedContent, noteId, isLocked, encrypted, encryption, lastContent]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleContentChange = (e) => {
        setContent(e.target.value);
        // Remove the scheduleAutoSave() call to prevent auto-save popups
        // Just update the status without scheduling saves
        setSaveStatus('editing');
    };

    const scheduleAutoSave = () => {
        setSaveStatus('editing');
        
        // Clear any existing auto-save timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        
        // We'll keep the status update but not trigger auto-save or popups
        // Just provide visual feedback that there are unsaved changes
    };

    const handleSave = () => {
        if (content === lastContent) {
            // No changes to save, just return
            return;
        }
        
        try {
            // Process content for saving
            let contentToSave = content;
            
            // If encryption is enabled and we have a key, encrypt the content
            if (encrypted && encryption.key) {
                try {
                    contentToSave = encryption.encryptNote(content);
                    if (!contentToSave) {
                        throw new Error("Encryption returned empty content");
                    }
                } catch (error) {
                    console.error("Encryption failed during save", error);
                    alert("Could not encrypt the note. Please check your encryption settings.");
                    return;
                }
            }
            
            // Save explicit version for manual saves
            try {
                saveVersion(noteId, contentToSave);
            } catch (error) {
                console.error("Failed to save version:", error);
                // Continue with saving even if version fails
            }
            
            // Update tracking state
            setLastContent(content);
            
            // Save the note with updated content
            onSave({
                title,
                content: contentToSave,
                isEncrypted: encrypted,
                lastModified: new Date().toISOString()
            });

            if (noteId) {
                // Log the modification
                logNoteAccess(noteId, 'modified');
            }
            
            setSaveStatus('saved');
            setTimeout(() => {
                setSaveStatus('');
            }, 2000);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save note. Please try again.");
        }
    };

    const handleCommit = () => {
        if (!commitMessage.trim()) {
            alert("Please enter a commit message");
            return;
        }
        
        setIsCommitting(true);
        
        // Process content for saving with commit message
        let contentToSave = content;
        
        // If encryption is enabled and we have a key, encrypt the content
        if (encrypted && encryption.key) {
            try {
                contentToSave = encryption.encryptNote(content);
                if (!contentToSave) {
                    throw new Error("Encryption returned empty content");
                }
            } catch (error) {
                console.error("Encryption failed during commit", error);
                alert("Could not encrypt the note for commit. Please check your encryption settings.");
                setIsCommitting(false);
                return;
            }
        }
        
        // Save version with explicit commit message
        try {
            const versionId = saveVersion(noteId, contentToSave, commitMessage);
            if (versionId) {
                setLastContent(content);
                setCommitMessage('');
                setShowCommitModal(false);
                setIsCommitting(false);
                
                // Also save the current state of the note
                onSave({
                    title,
                    content: contentToSave,
                    isEncrypted: encrypted,
                    lastModified: new Date().toISOString()
                });
                
                setSaveStatus('committed');
                setTimeout(() => setSaveStatus(''), 2000);
                
                console.log(`Commit ${versionId} created successfully`);
            }
        } catch (error) {
            console.error("Failed to create commit:", error);
            alert("Failed to create commit. Please try again.");
            setIsCommitting(false);
        }
    };

    const toggleEncryption = () => {
        if (!encrypted) {
            // Show the passphrase modal for new encryption
            setShowPassphraseModal(true);
            logNoteAccess(noteId, 'encrypted');
            return;
        } else {
            logNoteAccess(noteId, 'decrypted');
            // ...existing code for disabling encryption...
        }
    };

    const handleSetPassphrase = (passphrase, rememberDevice) => {
        if (!passphrase) return;

        try {
            // Set the encryption key
            encryption.generateKey(passphrase, rememberDevice);
            
            // Update UI state
            setEncrypted(true);
            setShowPassphraseModal(false);
            
            // Encrypt and save the content if it exists
            if (content && content.trim() !== '') {
                // Use the simple encryption method
                const encryptedContent = encrypt(content, passphrase);
                
                // Save the encrypted note
                onSave({
                    title,
                    content: encryptedContent,
                    isEncrypted: true,
                    lastModified: new Date().toISOString()
                });
                
                setSaveStatus('saved');
                showNotification('Note encrypted successfully', 'success');
                setTimeout(() => setSaveStatus(''), 2000);
            } else {
                // Handle empty notes
                onSave({
                    title,
                    content: '',
                    isEncrypted: true,
                    lastModified: new Date().toISOString()
                });
                
                setSaveStatus('encrypted');
                showNotification('Encryption enabled', 'info');
                setTimeout(() => setSaveStatus(''), 2000);
            }
        } catch (error) {
            console.error('Error setting passphrase:', error);
            alert('Failed to encrypt note. Please try again.');
        }
    };

    const handleUnlock = () => {
        if (!passphrase) {
            setUnlockError('Please enter your passphrase');
            return;
        }
        
        setUnlocking(true);
        setUnlockError('');
        
        // Small delay to show loading UI
        setTimeout(() => {
            try {
                console.log("Starting unlock process...");
                
                // Set the key first
                encryption.writeEncryptionKey(passphrase);
                
                // Debug the content we're trying to decrypt
                console.log(`Content length to decrypt: ${initialContent.length}`);
                
                // First, try to decrypt using direct method from the simpleEncryption utility
                try {
                    // Import directly to avoid any potential issues
                    const { decrypt } = require('../utils/simpleEncryption');
                    const directDecrypted = decrypt(initialContent, passphrase);
                    
                    if (directDecrypted) {
                        console.log("Direct decryption successful");
                        setContent(directDecrypted);
                        setIsLocked(false);
                        setShowUnlockModal(false);
                        showNotification('Note unlocked successfully', 'success');
                        return; // Exit early if successful
                    }
                } catch (directError) {
                    console.warn("Direct decryption failed:", directError);
                }
                
                // Then try all fallback methods
                const decrypted = decryptWithFallbacks(initialContent, passphrase);
                
                if (decrypted) {
                    console.log("Fallback decryption successful");
                    setContent(decrypted);
                    setIsLocked(false);
                    setShowUnlockModal(false);
                    showNotification('Note unlocked successfully', 'success');
                } else {
                    console.error("All decryption attempts failed");
                    setUnlockError('Incorrect passphrase. Please try again.');
                    encryption.clearKey(); // Clear the incorrect key
                }
            } catch (error) {
                console.error('Error unlocking note:', error);
                setUnlockError('Failed to decrypt note. Please check your passphrase.');
                encryption.clearKey(); // Clear the incorrect key
            } finally {
                setUnlocking(false);
            }
        }, 500);
    };
    
    const getStatusClass = () => {
        if (saveStatus === 'editing') return 'editor-status saving';
        if (saveStatus === 'saved') return 'editor-status saved';
        if (saveStatus === 'committed') return 'editor-status committed';
        return 'editor-status';
    };
    
    const getStatusText = () => {
        if (saveStatus === 'editing') return 'Editing...';
        if (saveStatus === 'saved') return 'Saved';
        if (saveStatus === 'committed') return 'Changes committed';
        if (saveStatus === 'encrypted') return 'Encryption enabled';
        return '';
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const EncryptedContentPlaceholder = () => (
        <div className="encrypted-content">
            <div className="encrypted-icon">
                <i className="fas fa-lock fa-3x"></i>
            </div>
            <h3>This note is encrypted</h3>
            <p>You need to unlock it with your passphrase to view or edit the content.</p>
            <button 
                className="btn btn-primary mt-3 unlock-button"
                onClick={() => setShowUnlockModal(true)}
                autoFocus
            >
                <i className="fas fa-unlock"></i> Unlock Note
            </button>
        </div>
    );

    const UnlockModal = () => (
        <div className="modal">
            <div className="modal-content unlock-modal">
                <div className="modal-header">
                    <h2>
                        <i className="fas fa-lock"></i> 
                        Unlock Encrypted Note
                    </h2>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="unlock-passphrase" className="form-label">Enter your passphrase to unlock</label>
                        <div className="password-input-wrapper">
                            <input
                                id="unlock-passphrase"
                                name="unlock-passphrase"
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                placeholder="Enter passphrase..."
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleUnlock();
                                    }
                                }}
                            />
                            <button 
                                className="password-toggle-btn"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        {unlockError && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {unlockError}
                            </div>
                        )}
                    </div>
                    
                    <div className="form-check mt-3">
                        <input
                            type="checkbox"
                            id="rememberPassphrase"
                            name="rememberPassphrase"
                            checked={rememberPassphrase}
                            onChange={(e) => setRememberPassphrase(e.target.checked)}
                        />
                        <label htmlFor="rememberPassphrase">
                            Remember passphrase on this device
                        </label>
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowUnlockModal(false)}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleUnlock}
                        type="button"
                        disabled={unlocking}
                    >
                        {unlocking ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Unlocking...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-unlock"></i> Unlock
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    const CommitModal = () => (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Commit Changes</h2>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Commit Message</label>
                        <input
                            type="text"
                            className="form-control"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Describe your changes..."
                            autoFocus
                        />
                        <p className="text-muted mt-2">
                            A good commit message explains what changes you made and why.
                        </p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowCommitModal(false)}
                        disabled={isCommitting}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleCommit}
                        disabled={!commitMessage.trim() || isCommitting}
                    >
                        {isCommitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Committing...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-code-commit"></i> Commit
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    const EncryptionStatus = () => (
        <div className={`encryption-status ${encrypted ? 'active' : 'inactive'}`}>
            <i className={`fas ${encrypted ? 'fa-lock' : 'fa-lock-open'}`}></i>
            <span>{encrypted ? 'Encrypted' : 'Not Encrypted'}</span>
        </div>
    );

    const Notification = () => {
        if (!notification.message) return null;
        
        return (
            <div className={`notification ${notification.type}`}>
                <i className={`fas ${
                    notification.type === 'success' ? 'fa-check-circle' : 
                    notification.type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle'
                }`}></i>
                {notification.message}
            </div>
        );
    };

    const AccessLogsButton = () => (
        <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onShowLogs && onShowLogs(noteId, title)}
            title="View Access Logs"
        >
            <i className="fas fa-clock-rotate-left"></i> Access Logs
        </button>
    );

    return (
        <div className="editor">
            <div className="editor-header">
                <h2 className="editor-title">
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Note title"
                        disabled={isLocked}
                    />
                </h2>
                <EncryptionStatus />
                <div className="editor-actions">
                    <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                        disabled={isLocked}
                        title={isMarkdownPreview ? "Edit mode" : "Preview mode"}
                    >
                        <i className={`fas ${isMarkdownPreview ? 'fa-edit' : 'fa-eye'}`}></i>
                        {isMarkdownPreview ? ' Edit' : ' Preview'}
                    </button>
                    
                    <button 
                        className={`btn ${encrypted ? 'btn-success' : 'btn-outline'} btn-sm`}
                        onClick={toggleEncryption}
                        title={encrypted ? 'Encryption active (click to disable)' : 'Encryption inactive (click to enable)'}
                    >
                        <i className={`fas ${encrypted ? 'fa-lock' : 'fa-lock-open'}`}></i>
                        {encrypted ? ' Encrypted' : ' Not Encrypted'}
                    </button>
                    
                    <button 
                        className="btn btn-danger btn-sm"
                        onClick={onDelete}
                        title="Delete note"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>

                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCommitModal(true)}
                        disabled={isLocked}
                        title="Commit changes"
                    >
                        <i className="fas fa-code-commit"></i> Commit
                    </button>
                </div>
            </div>

            {isLocked ? (
                <EncryptedContentPlaceholder />
            ) : (
                <>
                    {isMarkdownPreview ? (
                        <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}></div>
                    ) : (
                        <textarea
                            ref={textAreaRef}
                            value={content}
                            onChange={handleContentChange}
                            placeholder="Write your note here... (Markdown supported)"
                            spellCheck="true"
                        />
                    )}
                </>
            )}

            <div className="editor-footer">
                <div className={getStatusClass()}>
                    {getStatusText()}
                </div>
                <div className="editor-actions">
                    <AccessLogsButton />
                    <button 
                        className="btn btn-outline-primary btn-sm btn-commit"
                        onClick={() => setShowCommitModal(true)}
                        disabled={isLocked || content === lastContent}
                        title="Commit changes to version history"
                    >
                        <i className="fas fa-code-commit"></i> Commit
                    </button>
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleSave}
                        disabled={isLocked || content === lastContent}
                        title="Save changes"
                    >
                        <i className="fas fa-save"></i> Save
                    </button>
                </div>
            </div>

            {showUnlockModal && <UnlockModal />}
            {showCommitModal && <CommitModal />}
            {showPassphraseModal && (
                <PassphraseModal
                    isOpen={showPassphraseModal}
                    onClose={() => setShowPassphraseModal(false)}
                    onSubmit={handleSetPassphrase}
                />
            )}
            <Notification />
        </div>
    );
};

export default Editor;