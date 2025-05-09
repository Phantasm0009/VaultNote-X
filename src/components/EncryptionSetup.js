import React, { useState } from 'react';
import { generateKeyPair } from '../utils/encryption';
import PassphraseModal from './PassphraseModal';

const EncryptionSetup = ({ onComplete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [keyPair, setKeyPair] = useState(null);

    const handleGenerateKeys = async () => {
        try {
            const keys = await generateKeyPair(passphrase);
            setKeyPair(keys);
            setTimeout(() => {
                onComplete();
            }, 3000);
        } catch (error) {
            console.error("Key generation failed", error);
            alert("Could not generate encryption keys. Please try again.");
        }
    };

    const handlePassphraseSubmit = (enteredPassphrase) => {
        setPassphrase(enteredPassphrase);
        handleGenerateKeys();
    };

    return (
        <div className="encryption-setup">
            <h2>Welcome to VaultNote X</h2>
            <p>VaultNote X uses strong encryption to keep your notes private and secure. 
               Before you can start using the app, let's set up encryption.</p>
               
            <div className="encryption-steps">
                <div className="encryption-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                        <h3>Create a Strong Passphrase</h3>
                        <p>Your passphrase is used to encrypt your notes. Choose something memorable but difficult for others to guess.</p>
                    </div>
                </div>
                
                <div className="encryption-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                        <h3>Keep Your Passphrase Safe</h3>
                        <p>If you forget your passphrase, you won't be able to decrypt your notes. There's no password reset.</p>
                    </div>
                </div>
                
                <div className="encryption-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                        <h3>Generate Encryption Keys</h3>
                        <p>Click the button below to create your encryption keys and start using VaultNote X.</p>
                    </div>
                </div>
            </div>
            
            <button 
                className="btn btn-primary btn-lg"
                onClick={() => setModalOpen(true)}
            >
                <i className="fas fa-key"></i> Set Up Encryption
            </button>
            
            {keyPair && (
                <div className="key-info mt-4">
                    <h3>Encryption Setup Complete!</h3>
                    <p>Your encryption keys have been generated successfully.</p>
                    <p>You'll be redirected to the app momentarily...</p>
                </div>
            )}
            
            <PassphraseModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSubmit={handlePassphraseSubmit} 
            />
        </div>
    );
};

export default EncryptionSetup;