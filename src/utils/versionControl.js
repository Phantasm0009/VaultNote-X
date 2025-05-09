import { v4 as uuidv4 } from 'uuid';

const VERSION_STORAGE_KEY = 'vaultnote-version-history';

// Load version history from localStorage
const loadVersionHistory = () => {
    try {
        const savedVersions = localStorage.getItem(VERSION_STORAGE_KEY);
        return savedVersions ? JSON.parse(savedVersions) : {};
    } catch (error) {
        console.error('Failed to load version history', error);
        return {};
    }
};

// Save version history to localStorage
const saveVersionHistory = (versions) => {
    try {
        localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
    } catch (error) {
        console.error('Failed to save version history', error);
    }
};

// Initialize version history from localStorage
let versionHistory = loadVersionHistory();

export const saveVersion = (noteId, content, message = null) => {
    // Skip saving empty versions or invalid notes
    if (!content || !noteId) return null;
    
    const timestamp = new Date().toISOString();
    const shortHash = generateShortHash(); // Git-like short hash
    
    // Initialize version history if it doesn't exist
    if (!versionHistory[noteId]) {
        versionHistory[noteId] = {
            master: [],
            branches: {},
            currentBranch: 'master',
            HEAD: null
        };
    }
    
    const noteHistory = versionHistory[noteId];
    const branch = noteHistory.currentBranch || 'master';
    
    // Initialize the branch if it doesn't exist
    if (branch !== 'master' && !noteHistory.branches[branch]) {
        noteHistory.branches[branch] = [];
    }
    
    // Get branch history, with proper fallback
    const branchHistory = branch === 'master' 
        ? (noteHistory.master || (noteHistory.master = []))
        : (noteHistory.branches[branch] || (noteHistory.branches[branch] = []));
    
    // Check if this is the same as the most recent version to avoid duplicate commits
    if (branchHistory && branchHistory.length > 0) {
        const lastVersion = branchHistory[branchHistory.length - 1];
        if (lastVersion && lastVersion.content === content) {
            return lastVersion.hash; // Don't create duplicate versions
        }
    }
    
    // Auto-generate commit message if not provided
    const commitMessage = message || 
        `Update note "${detectTitleFromContent(content)}" - ${formatTimestamp(timestamp)}`;
    
    // Create the new version (commit)
    const newVersion = {
        hash: shortHash,
        content: content,
        timestamp: timestamp,
        message: commitMessage,
        parent: noteHistory.HEAD
    };
    
    // Add to the current branch
    if (branch === 'master') {
        if (!Array.isArray(noteHistory.master)) {
            noteHistory.master = [];
        }
        noteHistory.master.push(newVersion);
    } else {
        if (!Array.isArray(noteHistory.branches[branch])) {
            noteHistory.branches[branch] = [];
        }
        noteHistory.branches[branch].push(newVersion);
    }
    
    // Update HEAD pointer
    noteHistory.HEAD = shortHash;
    
    // Save to localStorage (limited to most recent 100 versions)
    const limitVersions = () => {
        if (noteHistory.master && noteHistory.master.length > 100) {
            noteHistory.master = noteHistory.master.slice(-100);
        }
        
        if (noteHistory.branches) {
            for (const branchName in noteHistory.branches) {
                if (Array.isArray(noteHistory.branches[branchName]) && 
                    noteHistory.branches[branchName].length > 50) {
                    noteHistory.branches[branchName] = noteHistory.branches[branchName].slice(-50);
                }
            }
        }
    };
    
    limitVersions();
    saveVersionHistory(versionHistory);
    console.log(`Commit ${shortHash} saved for note ${noteId} at ${timestamp}`);
    
    return shortHash;
};

// Update the getVersions function to be more robust
export const getVersions = (noteId) => {
    // Reload from localStorage to ensure we have the most recent data
    versionHistory = loadVersionHistory();
    
    // If no version history for this note, return empty array
    if (!versionHistory || !noteId || !versionHistory[noteId]) {
        return [];
    }
    
    const noteHistory = versionHistory[noteId];
    
    // If note history structure is invalid, return empty array
    if (!noteHistory || !noteHistory.currentBranch) {
        return [];
    }
    
    const branch = noteHistory.currentBranch;
    
    // Determine which history array to use, with fallback to empty array
    let history;
    if (branch === 'master') {
        history = Array.isArray(noteHistory.master) ? noteHistory.master : [];
    } else {
        // Make sure branches object exists and contains the current branch
        history = (noteHistory.branches && Array.isArray(noteHistory.branches[branch])) 
            ? noteHistory.branches[branch] 
            : [];
    }
    
    // Format versions for display in reverse chronological order (newest first)
    return [...history].reverse().map(version => ({
        id: version.hash || 'unknown',
        hash: version.hash || 'unknown',
        content: version.content || '',
        timestamp: version.timestamp || new Date().toISOString(),
        message: version.message || 'Untitled change',
        isCurrent: version.hash === noteHistory.HEAD
    }));
};

// Create a new branch from the current HEAD
export const createBranch = (noteId, branchName) => {
    if (!versionHistory[noteId]) return false;
    
    const noteHistory = versionHistory[noteId];
    
    // Don't allow duplicate branch names
    if (branchName === 'master' || noteHistory.branches[branchName]) {
        return false;
    }
    
    // Find the HEAD commit
    const headCommit = findCommitByHash(noteId, noteHistory.HEAD);
    if (!headCommit) return false;
    
    // Create the new branch with the HEAD commit
    noteHistory.branches[branchName] = [headCommit];
    noteHistory.currentBranch = branchName;
    
    saveVersionHistory(versionHistory);
    return true;
};

// Switch to a different branch
export const switchBranch = (noteId, branchName) => {
    if (!versionHistory[noteId]) return null;
    
    const noteHistory = versionHistory[noteId];
    
    // Make sure the branch exists
    if (branchName !== 'master' && !noteHistory.branches[branchName]) {
        return null;
    }
    
    // Switch branch and get the latest commit
    noteHistory.currentBranch = branchName;
    const branch = branchName === 'master' ? noteHistory.master : noteHistory.branches[branchName];
    
    if (branch.length === 0) return null;
    
    const latestCommit = branch[branch.length - 1];
    noteHistory.HEAD = latestCommit.hash;
    
    saveVersionHistory(versionHistory);
    return latestCommit;
};

// Helper functions
const generateShortHash = () => {
    // Create a Git-like short hash (7 characters)
    return Math.random().toString(36).substring(2, 9);
};

const findCommitByHash = (noteId, hash) => {
    if (!versionHistory[noteId]) return null;
    
    const noteHistory = versionHistory[noteId];
    
    // Check master branch
    const masterCommit = noteHistory.master.find(c => c.hash === hash);
    if (masterCommit) return masterCommit;
    
    // Check other branches
    for (const branchName in noteHistory.branches) {
        const branchCommit = noteHistory.branches[branchName].find(c => c.hash === hash);
        if (branchCommit) return branchCommit;
    }
    
    return null;
};

const detectTitleFromContent = (content) => {
    // Try to extract a title from the content
    if (!content) return "Untitled";
    
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length <= 30) {
        return firstLine;
    } else {
        return firstLine.substring(0, 27) + '...';
    }
};

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};