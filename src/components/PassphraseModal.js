import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

const PassphraseModal = ({ isOpen, onClose, onSubmit }) => {
    const [passphrase, setPassphrase] = useState('');
    const [confirmPassphrase, setConfirmPassphrase] = useState('');
    const [error, setError] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [strengthResult, setStrengthResult] = useState({ strength: 'Weak', criteriaMet: 0 });
    const [showPassword, setShowPassword] = useState(false);
    
    // Reset state when modal is opened
    useEffect(() => {
        if (isOpen) {
            setPassphrase('');
            setConfirmPassphrase('');
            setError('');
            setShowPassword(false);
            // Keep the remember device preference
        }
    }, [isOpen]);

    const handlePassphraseChange = (e) => {
        const value = e.target.value;
        setPassphrase(value);
        const result = evaluatePasswordStrength(value);
        setStrengthResult(result);
    };

    const handleConfirmChange = (e) => {
        setConfirmPassphrase(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // For existing notes where we're just unlocking, don't check strength
        if (!confirmPassphrase && passphrase) {
            onSubmit(passphrase, rememberDevice);
            return;
        }
        
        if (strengthResult.strength === 'Weak' && passphrase.length < 8) {
            setError('Please enter a stronger passphrase (at least 8 characters).');
            return;
        }
        
        if (passphrase !== confirmPassphrase && confirmPassphrase) {
            setError('Passphrases do not match.');
            return;
        }
        
        onSubmit(passphrase, rememberDevice);
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Set Encryption Passphrase</h2>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="passphrase-input" className="form-label">Passphrase</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="passphrase-input"
                                    name="passphrase"
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    value={passphrase}
                                    onChange={handlePassphraseChange}
                                    placeholder="Enter your passphrase"
                                    autoFocus
                                    required
                                />
                                <button 
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            
                            <div className="password-strength mt-2">
                                <div className="strength-bar">
                                    <div className={`strength-bar-fill ${strengthResult.strength.toLowerCase()}`}></div>
                                </div>
                                <div className="strength-text">
                                    <span>Password strength:</span>
                                    <span>{strengthResult.strength}</span>
                                </div>
                                {strengthResult.feedback && (
                                    <p className="mt-1" style={{fontSize: '0.8rem', color: '#666'}}>
                                        {strengthResult.feedback}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {confirmPassphrase !== undefined && (
                            <div className="form-group">
                                <label htmlFor="confirm-passphrase" className="form-label">Confirm Passphrase</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="confirm-passphrase"
                                        name="confirm-passphrase"
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        value={confirmPassphrase}
                                        onChange={handleConfirmChange}
                                        placeholder="Confirm your passphrase"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="form-check mt-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="rememberDevice"
                                checked={rememberDevice}
                                onChange={(e) => setRememberDevice(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="rememberDevice">
                                Remember on this device
                            </label>
                            <p className="text-muted" style={{fontSize: '0.8rem'}}>
                                This will store a secure reference on this device, so you don't have to
                                enter your passphrase each time you open the app.
                            </p>
                        </div>
                        
                        {error && <p className="error">{error}</p>}
                        
                        <div className="text-center mt-3">
                            <p style={{fontSize: '0.85rem', color: '#666'}}>
                                Remember this passphrase carefully! If forgotten, 
                                you won't be able to decrypt your notes.
                            </p>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Set Passphrase</button>
                </div>
            </div>
        </div>
    );
};

PassphraseModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default PassphraseModal;