import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header = ({ onNewNote, onSetPassphrase }) => {
    return (
        <header className="header">
            <h1 className="app-title">
                <i className="fas fa-shield-alt"></i> 
                VaultNote X
            </h1>
            <div className="d-flex gap-2 align-items-center">
                <ThemeToggle />
                <button className="btn btn-primary" onClick={onNewNote}>
                    <i className="fas fa-plus"></i> New Note
                </button>
                <button className="btn btn-outline-primary" onClick={onSetPassphrase}>
                    <i className="fas fa-key"></i> Security
                </button>
            </div>
        </header>
    );
};

export default Header;