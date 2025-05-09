import { useState, useEffect } from 'react';
import { encrypt, decrypt } from '../utils/simpleEncryption';
import CryptoJS from 'crypto-js';

const ENCRYPTION_STATUS_KEY = 'vaultnote-encryption-status';
const ENCRYPTION_REMEMBER_KEY = 'vaultnote-encryption-remember';

const useEncryption = () => {
    const [key, setKey] = useState(null);
    const [error, setError] = useState(null);
    const [isLocked, setIsLocked] = useState(true);
    const [rememberDevice, setRememberDevice] = useState(false);

    // On mount, check for saved encryption key
    useEffect(() => {
        // Clear any previous error
        setError(null);
        
        try {
            // Check for session storage key first (current session)
            const sessionData = sessionStorage.getItem(ENCRYPTION_STATUS_KEY);
            if (sessionData) {
                const { key: storedKey } = JSON.parse(sessionData);
                if (storedKey) {
                    console.log("Found encryption key in session storage");
                    setKey(storedKey);
                    setIsLocked(false);
                    return;
                }
            }
            
            // Check for remembered device
            const rememberedData = localStorage.getItem(ENCRYPTION_REMEMBER_KEY);
            if (rememberedData) {
                const { deviceId, timestamp } = JSON.parse(rememberedData);
                if (deviceId) {
                    setRememberDevice(true);
                    // We found a remembered device, but user needs to enter passphrase
                    console.log("Found remembered device settings");
                }
            }
        } catch (error) {
            console.error("Error loading encryption settings:", error);
        }
    }, []);

    const generateKey = (passphrase, remember = false) => {
        if (!passphrase) {
            console.error('Passphrase is required');
            setError('Passphrase is required');
            return null;
        }

        try {
            // Set the key directly for current session
            setKey(passphrase);
            setIsLocked(false);
            
            // Save to session storage (current browser session only)
            sessionStorage.setItem(ENCRYPTION_STATUS_KEY, JSON.stringify({
                key: passphrase,
                timestamp: Date.now()
            }));
            
            // If remember is enabled, store device identifier
            if (remember) {
                const deviceId = CryptoJS.SHA256(navigator.userAgent + navigator.language + screen.width).toString();
                
                localStorage.setItem(ENCRYPTION_REMEMBER_KEY, JSON.stringify({
                    deviceId: deviceId,
                    timestamp: Date.now()
                }));
                
                setRememberDevice(true);
            }
            
            console.log("Encryption key generated and stored successfully");
            return passphrase;
        } catch (error) {
            console.error('Error generating encryption key:', error);
            setError('Failed to generate encryption key');
            return null;
        }
    };

    const writeEncryptionKey = (passphrase) => {
        if (!passphrase) {
            console.error('Passphrase is required');
            setError('Passphrase is required');
            return null;
        }

        try {
            // Set key directly (useful for known working passphrase)
            setKey(passphrase);
            setIsLocked(false);
            
            // Save to session storage
            sessionStorage.setItem(ENCRYPTION_STATUS_KEY, JSON.stringify({
                key: passphrase,
                timestamp: Date.now()
            }));
            
            return passphrase;
        } catch (error) {
            console.error('Error setting encryption key:', error);
            setError('Failed to set encryption key');
            return null;
        }
    };

    const clearKey = () => {
        setKey(null);
        setIsLocked(true);
        sessionStorage.removeItem(ENCRYPTION_STATUS_KEY);
        
        // Optionally clear remembered device too
        if (rememberDevice) {
            localStorage.removeItem(ENCRYPTION_REMEMBER_KEY);
            setRememberDevice(false);
        }
    };

    const encryptNote = (note) => {
        if (!key) {
            setError('Encryption key is not set.');
            return null;
        }
        
        if (!note) return '';
        
        try {
            // Use simple encryption
            return encrypt(note, key);
        } catch (err) {
            console.error("Encryption error:", err);
            setError('Encryption failed.');
            return null;
        }
    };

    const decryptNote = (encryptedNote) => {
        if (!key) {
            setError('Encryption key is not set.');
            return null;
        }
        
        if (!encryptedNote) return '';
        
        try {
            // Try standard decryption first
            try {
                const result = decrypt(encryptedNote, key);
                if (result && result.length > 0) {
                    return result;
                }
            } catch (initialError) {
                // If standard decryption fails, try other methods
                console.warn("Initial decryption failed, trying alternative methods");
            }
            
            // Try multiple direct approaches with different configurations
            const CryptoJS = require('crypto-js');
            const decryptionMethods = [
                // Standard AES decrypt with UTF8 encoding
                () => {
                    const bytes = CryptoJS.AES.decrypt(encryptedNote, key);
                    return bytes.toString(CryptoJS.enc.Utf8);
                },
                // AES with specific options
                () => {
                    const bytes = CryptoJS.AES.decrypt(encryptedNote, key, {
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    return bytes.toString(CryptoJS.enc.Utf8);
                },
                // Try with password as key directly
                () => {
                    const parseKey = CryptoJS.enc.Utf8.parse(key);
                    const bytes = CryptoJS.AES.decrypt(encryptedNote, parseKey, {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    return bytes.toString(CryptoJS.enc.Utf8);
                }
            ];
            
            for (let method of decryptionMethods) {
                try {
                    const result = method();
                    if (result && result.length > 0) {
                        return result;
                    }
                } catch (e) {
                    // Continue to next method
                }
            }
            
            // If we get here, all methods failed
            throw new Error('Failed to decrypt with any method');
        } catch (err) {
            console.error("Decryption error:", err);
            setError('Decryption failed. The passphrase might be incorrect.');
            return null;
        }
    };

    // Simple function to check if text looks valid
    const isValidText = (text) => {
        // Text should have a reasonable proportion of printable characters
        const printableChars = text.replace(/[^\x20-\x7E]/g, '');
        return printableChars.length > text.length * 0.7;
    };

    // Test a passphrase directly on encrypted content
    const tryPassphrase = (encryptedContent, testPassphrase) => {
        if (!encryptedContent || !testPassphrase) return false;
        
        try {
            // Multiple direct approaches to test the passphrase
            try {
                const bytes = CryptoJS.AES.decrypt(encryptedContent, testPassphrase);
                const plainText = bytes.toString(CryptoJS.enc.Utf8);
                if (plainText && plainText.length > 0) return true;
            } catch (e) {}
            
            try {
                const decrypted = decrypt(encryptedContent, testPassphrase);
                return !!decrypted;
            } catch (e) {}
            
            return false;
        } catch (err) {
            return false;
        }
    };

    const hasRememberedEncryption = () => {
        return !!localStorage.getItem(ENCRYPTION_REMEMBER_KEY);
    };

    return {
        key,
        generateKey,
        writeEncryptionKey,
        clearKey,
        encryptNote,
        decryptNote,
        tryPassphrase,
        error,
        isLocked,
        rememberDevice,
        hasRememberedEncryption
    };
};

export default useEncryption;