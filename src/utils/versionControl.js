import { v4 as uuidv4 } from 'uuid';

const VERSION_STORAGE_KEY = 'vaultnote-version-history';


const loadVersionHistory = () => {
    try {
        const savedVersions = localStorage.getItem(VERSION_STORAGE_KEY);
        return savedVersions ? JSON.parse(savedVersions) : {};
    } catch (error) {
        console.error('Failed to load version history', error);
        return {};
    }
};


const saveVersionHistory = (versions) => {
    try {
        localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
    } catch (error) {
        console.error('Failed to save version history', error);
    }
};


let versionHistory = loadVersionHistory();

export const saveVersion = (noteId, content, message = null) => {
    
    if (!content || !noteId) return null;
    
    const timestamp = new Date().toISOString();
    const shortHash = generateShortHash(); 
    
    
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
    
    
    if (branch !== 'master' && !noteHistory.branches[branch]) {
        noteHistory.branches[branch] = [];
    }
    
    
    const branchHistory = branch === 'master' 
        ? (noteHistory.master || (noteHistory.master = []))
        : (noteHistory.branches[branch] || (noteHistory.branches[branch] = []));
    
    
    if (branchHistory && branchHistory.length > 0) {
        const lastVersion = branchHistory[branchHistory.length - 1];
        if (lastVersion && lastVersion.content === content) {
            return lastVersion.hash; 
        }
    }
    
    
    const commitMessage = message || 
        `Update note "${detectTitleFromContent(content)}" - ${formatTimestamp(timestamp)}`;
    
    
    const newVersion = {
        hash: shortHash,
        content: content,
        timestamp: timestamp,
        message: commitMessage,
        parent: noteHistory.HEAD
    };
    
    
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
    
    
    noteHistory.HEAD = shortHash;
    
    
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


export const getVersions = (noteId) => {
    
    versionHistory = loadVersionHistory();
    
    
    if (!versionHistory || !noteId || !versionHistory[noteId]) {
        return [];
    }
    
    const noteHistory = versionHistory[noteId];
    
    
    if (!noteHistory || !noteHistory.currentBranch) {
        return [];
    }
    
    const branch = noteHistory.currentBranch;
    
    
    let history;
    if (branch === 'master') {
        history = Array.isArray(noteHistory.master) ? noteHistory.master : [];
    } else {
        
        history = (noteHistory.branches && Array.isArray(noteHistory.branches[branch])) 
            ? noteHistory.branches[branch] 
            : [];
    }
    
    
    return [...history].reverse().map(version => ({
        id: version.hash || 'unknown',
        hash: version.hash || 'unknown',
        content: version.content || '',
        timestamp: version.timestamp || new Date().toISOString(),
        message: version.message || 'Untitled change',
        isCurrent: version.hash === noteHistory.HEAD
    }));
};


export const createBranch = (noteId, branchName) => {
    if (!versionHistory[noteId]) return false;
    
    const noteHistory = versionHistory[noteId];
    
    
    if (branchName === 'master' || noteHistory.branches[branchName]) {
        return false;
    }
    
    
    const headCommit = findCommitByHash(noteId, noteHistory.HEAD);
    if (!headCommit) return false;
    
    
    noteHistory.branches[branchName] = [headCommit];
    noteHistory.currentBranch = branchName;
    
    saveVersionHistory(versionHistory);
    return true;
};


export const switchBranch = (noteId, branchName) => {
    if (!versionHistory[noteId]) return null;
    
    const noteHistory = versionHistory[noteId];
    
    
    if (branchName !== 'master' && !noteHistory.branches[branchName]) {
        return null;
    }
    
    
    noteHistory.currentBranch = branchName;
    const branch = branchName === 'master' ? noteHistory.master : noteHistory.branches[branchName];
    
    if (branch.length === 0) return null;
    
    const latestCommit = branch[branch.length - 1];
    noteHistory.HEAD = latestCommit.hash;
    
    saveVersionHistory(versionHistory);
    return latestCommit;
};


const generateShortHash = () => {
    
    return Math.random().toString(36).substring(2, 9);
};

const findCommitByHash = (noteId, hash) => {
    if (!versionHistory[noteId]) return null;
    
    const noteHistory = versionHistory[noteId];
    
    
    const masterCommit = noteHistory.master.find(c => c.hash === hash);
    if (masterCommit) return masterCommit;
    
    
    for (const branchName in noteHistory.branches) {
        const branchCommit = noteHistory.branches[branchName].find(c => c.hash === hash);
        if (branchCommit) return branchCommit;
    }
    
    return null;
};

const detectTitleFromContent = (content) => {
    
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