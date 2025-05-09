import React, { useState, useEffect } from 'react';
import { diffText } from '../utils/diffUtil';

const VersionHistory = ({ versions, currentContent, isEncrypted, onRestore }) => {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [showConfirmRestore, setShowConfirmRestore] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [branchName, setBranchName] = useState('');
    const [showCreateBranch, setShowCreateBranch] = useState(false);
    const [diffType, setDiffType] = useState('inline'); // 'inline' or 'split'

    // Select the HEAD commit by default
    useEffect(() => {
        if (versions && versions.length > 0) {
            const headVersion = versions.find(v => v.isCurrent);
            if (headVersion) {
                setSelectedVersion(headVersion);
                setShowDiff(false);
            }
        } else {
            setSelectedVersion(null);
            setShowDiff(false);
        }
    }, [versions]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
            return `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return `Yesterday at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else {
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        }
    };

    const formatCommitMessage = (message) => {
        if (!message) return 'Unnamed commit';
        
        // Split by lines if there are any
        const lines = message.split('\n');
        return {
            title: lines[0],
            body: lines.length > 1 ? lines.slice(1).join('\n') : ''
        };
    };
    
    const handleVersionSelect = (version) => {
        setSelectedVersion(version);
        setShowDiff(true);
    };
    
    const handleRestore = () => {
        setShowConfirmRestore(true);
    };
    
    const confirmRestore = () => {
        if (selectedVersion) {
            onRestore(selectedVersion);
            setShowConfirmRestore(false);
            setShowDiff(false);
        }
    };
    
    const cancelRestore = () => {
        setShowConfirmRestore(false);
    };
    
    const handleCreateBranch = () => {
        // This would call the createBranch function from versionControl
        setShowCreateBranch(false);
        setBranchName('');
    };
    
    const getDiff = () => {
        try {
            if (!selectedVersion || isEncrypted) return null;
            return diffText(selectedVersion.content, currentContent);
        } catch (error) {
            console.error("Error generating diff:", error);
            return '<span class="error">Error comparing versions</span>';
        }
    };

    const hasDifferences = () => {
        return selectedVersion && currentContent !== selectedVersion.content;
    };

    const RestoreConfirmDialog = () => (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header git-modal-header">
                    <h2><i className="fas fa-code-branch"></i> Checkout Previous Version</h2>
                </div>
                <div className="modal-body">
                    <div className="commit-detail">
                        <div className="commit-info-box">
                            <div className="commit-hash">
                                <i className="fas fa-code-commit"></i> {selectedVersion.hash}
                            </div>
                            <div className="commit-date">{formatDate(selectedVersion.timestamp)}</div>
                            <div className="commit-message-full">{selectedVersion.message}</div>
                        </div>
                    </div>
                    <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Warning:</strong> This will replace your current note content.
                            <p>Any unsaved changes will be lost.</p>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={cancelRestore}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={confirmRestore}>
                        <i className="fas fa-check"></i> Checkout
                    </button>
                </div>
            </div>
        </div>
    );

    const CreateBranchDialog = () => (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header git-modal-header">
                    <h2><i className="fas fa-code-branch"></i> Create New Branch</h2>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Branch Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="Enter new branch name"
                            autoFocus
                        />
                    </div>
                    <div className="commit-detail">
                        <div className="commit-info-box">
                            <div className="commit-hash">
                                <i className="fas fa-code-commit"></i> {selectedVersion?.hash || 'HEAD'}
                            </div>
                            <div className="commit-date">
                                {selectedVersion ? formatDate(selectedVersion.timestamp) : 'Current'}
                            </div>
                            <div className="commit-message-full">
                                {selectedVersion ? selectedVersion.message : 'Current version'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowCreateBranch(false)}>
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleCreateBranch}
                        disabled={!branchName.trim()}
                    >
                        <i className="fas fa-code-branch"></i> Create Branch
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="version-history">
            <div className="version-history-header">
                <h2><i className="fas fa-history"></i> Version History</h2>
                <div className="branch-controls">
                    <select className="branch-select">
                        <option value="master">master</option>
                    </select>
                    <button className="btn btn-sm btn-outline-primary">
                        <i className="fas fa-code-branch"></i> Branch
                    </button>
                </div>
            </div>
            
            <div className="version-history-content">
                {versions.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-history"></i>
                        <p>No version history</p>
                        <p className="text-muted">Save changes to create version history</p>
                    </div>
                ) : (
                    <div className="version-history-layout">
                        <div className="commit-panel">
                            <div className="commit-panel-header">
                                <h3>Commits</h3>
                                <span className="commit-count">{versions.length} commits</span>
                            </div>
                            <ul className="commit-list">
                                {versions.map((version) => {
                                    const commit = formatCommitMessage(version.message);
                                    const isSelected = selectedVersion && selectedVersion.id === version.id;
                                    
                                    return (
                                        <li 
                                            key={version.id}
                                            className={`commit-item ${isSelected ? 'active' : ''} ${version.isCurrent ? 'current' : ''}`}
                                            onClick={() => handleVersionSelect(version)}
                                        >
                                            <div className="commit-timeline">
                                                <div className="commit-dot"></div>
                                                <div className="commit-line"></div>
                                            </div>
                                            <div className="commit-info">
                                                <div className="commit-message">
                                                    <div className="commit-message-text">
                                                        {commit.title}
                                                    </div>
                                                    <div className="commit-actions">
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRestore();
                                                            }}
                                                            title="Checkout this version"
                                                        >
                                                            <i className="fas fa-code-branch"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="commit-meta">
                                                    <span className="commit-hash">
                                                        <i className="fas fa-code-commit"></i> {version.hash.substring(0, 7)}
                                                    </span>
                                                    <span className="commit-time">
                                                        <i className="far fa-clock"></i> {formatDate(version.timestamp)}
                                                    </span>
                                                </div>
                                                {commit.body && (
                                                    <div className="commit-body">{commit.body}</div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        
                        {showDiff && selectedVersion && !isEncrypted && (
                            <div className="diff-panel">
                                <div className="diff-panel-header">
                                    <div className="diff-title">
                                        <h3>
                                            Changes: <code>{selectedVersion.hash.substring(0, 7)}</code>
                                            <span className="diff-arrow">→</span>
                                            <code>HEAD</code>
                                        </h3>
                                    </div>
                                    <div className="diff-controls">
                                        <div className="diff-type-selector">
                                            <button 
                                                className={`btn btn-sm ${diffType === 'inline' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setDiffType('inline')}
                                                title="Inline diff view"
                                            >
                                                <i className="fas fa-bars"></i>
                                            </button>
                                            <button 
                                                className={`btn btn-sm ${diffType === 'split' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setDiffType('split')}
                                                title="Split diff view"
                                            >
                                                <i className="fas fa-columns"></i>
                                            </button>
                                        </div>
                                        <div className="diff-actions">
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={handleRestore}
                                                title="Checkout this version"
                                                disabled={!hasDifferences()}
                                            >
                                                <i className="fas fa-code-branch"></i> Checkout
                                            </button>
                                            <button 
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => setShowCreateBranch(true)}
                                                title="Create branch from this commit"
                                            >
                                                <i className="fas fa-code-branch"></i> Branch
                                            </button>
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setShowDiff(false)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className={`diff-content diff-${diffType}`}>
                                    <div className="diff-scroller" dangerouslySetInnerHTML={{ __html: getDiff() }}></div>
                                </div>
                            </div>
                        )}
                        
                        {!showDiff && selectedVersion && (
                            <div className="diff-panel empty-diff">
                                <div className="empty-diff-message">
                                    <i className="fas fa-code-compare"></i>
                                    <p>Select a commit to view changes</p>
                                </div>
                            </div>
                        )}
                        
                        {!selectedVersion && (
                            <div className="diff-panel empty-diff">
                                <div className="empty-diff-message">
                                    <i className="fas fa-code-compare"></i>
                                    <p>Select a commit to view changes</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {showConfirmRestore && selectedVersion && <RestoreConfirmDialog />}
            {showCreateBranch && selectedVersion && <CreateBranchDialog />}
        </div>
    );
};

export default VersionHistory;