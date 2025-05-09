

const ACCESS_LOG_KEY = 'vaultnote-access-logs';


const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceInfo = 'Unknown Device';
  
  if (/Windows/.test(userAgent)) {
    deviceInfo = 'Windows';
  } else if (/Macintosh/.test(userAgent)) {
    deviceInfo = 'Mac';
  } else if (/Android/.test(userAgent)) {
    deviceInfo = 'Android';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceInfo = 'iOS';
  } else if (/Linux/.test(userAgent)) {
    deviceInfo = 'Linux';
  }

  
  if (/Chrome/.test(userAgent)) {
    deviceInfo += ' - Chrome';
  } else if (/Firefox/.test(userAgent)) {
    deviceInfo += ' - Firefox';
  } else if (/Safari/.test(userAgent)) {
    deviceInfo += ' - Safari';
  } else if (/Edge/.test(userAgent)) {
    deviceInfo += ' - Edge';
  }

  return deviceInfo;
};


export const logNoteAccess = (noteId, action) => {
  try {
    
    const existingLogsJSON = localStorage.getItem(ACCESS_LOG_KEY);
    const existingLogs = existingLogsJSON ? JSON.parse(existingLogsJSON) : {};
    
    
    if (!existingLogs[noteId]) {
      existingLogs[noteId] = [];
    }
    
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action, 
      deviceInfo: getDeviceInfo()
    };
    
    
    existingLogs[noteId].unshift(logEntry);
    if (existingLogs[noteId].length > 100) {
      existingLogs[noteId] = existingLogs[noteId].slice(0, 100);
    }
    
    
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(existingLogs));
    
    return true;
  } catch (error) {
    console.error("Error logging note access:", error);
    return false;
  }
};


export const getNoteAccessLogs = (noteId) => {
  try {
    const existingLogsJSON = localStorage.getItem(ACCESS_LOG_KEY);
    if (!existingLogsJSON) return [];
    
    const existingLogs = JSON.parse(existingLogsJSON);
    return existingLogs[noteId] || [];
  } catch (error) {
    console.error("Error retrieving note access logs:", error);
    return [];
  }
};


export const clearNoteAccessLogs = (noteId) => {
  try {
    const existingLogsJSON = localStorage.getItem(ACCESS_LOG_KEY);
    if (!existingLogsJSON) return true;
    
    const existingLogs = JSON.parse(existingLogsJSON);
    if (existingLogs[noteId]) {
      delete existingLogs[noteId];
      localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(existingLogs));
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing note access logs:", error);
    return false;
  }
};


export const clearAllAccessLogs = () => {
  try {
    localStorage.removeItem(ACCESS_LOG_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing all access logs:", error);
    return false;
  }
};