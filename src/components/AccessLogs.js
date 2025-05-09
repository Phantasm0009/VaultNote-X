import React, { useState, useEffect } from 'react';
import { getNoteAccessLogs, clearNoteAccessLogs } from '../utils/accessLogs';

const AccessLogs = ({ noteId, noteName }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (noteId) {
      const noteLogs = getNoteAccessLogs(noteId);
      setLogs(noteLogs);
    }
  }, [noteId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear access logs for this note? This cannot be undone.")) {
      clearNoteAccessLogs(noteId);
      setLogs([]);
    }
  };

  // Filter logs based on selected filter
  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.action === filter);

  return (
    <div className="access-logs">
      <div className="access-logs-header">
        <h2><i className="fas fa-clock-rotate-left"></i> Access Logs</h2>
        <p className="note-name">{noteName || 'Note'}</p>
      </div>
      
      <div className="access-logs-actions">
        <div className="filter-controls">
          <label htmlFor="log-filter">Filter: </label>
          <select 
            id="log-filter" 
            value={filter} 
            onChange={handleFilterChange}
            className="log-filter-select"
          >
            <option value="all">All Actions</option>
            <option value="viewed">Viewed</option>
            <option value="modified">Modified</option>
            <option value="created">Created</option>
            <option value="encrypted">Encrypted</option>
            <option value="decrypted">Decrypted</option>
          </select>
        </div>
        
        <button 
          className="btn btn-sm btn-outline-danger" 
          onClick={handleClearLogs}
        >
          <i className="fas fa-trash"></i> Clear Logs
        </button>
      </div>
      
      {logs.length === 0 ? (
        <div className="empty-logs">
          <i className="fas fa-search"></i>
          <p>No access logs found</p>
        </div>
      ) : (
        <div className="log-entries">
          <table className="log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} className={`log-entry log-${log.action}`}>
                  <td className="log-timestamp">{formatDate(log.timestamp)}</td>
                  <td className="log-action">
                    <span className={`log-badge ${log.action}`}>
                      {log.action === 'viewed' && <i className="fas fa-eye"></i>}
                      {log.action === 'modified' && <i className="fas fa-pencil"></i>}
                      {log.action === 'created' && <i className="fas fa-plus-circle"></i>}
                      {log.action === 'encrypted' && <i className="fas fa-lock"></i>}
                      {log.action === 'decrypted' && <i className="fas fa-unlock"></i>}
                      {log.action}
                    </span>
                  </td>
                  <td className="log-device">
                    <i className="fas fa-laptop"></i> {log.deviceInfo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccessLogs;