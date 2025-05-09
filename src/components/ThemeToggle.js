import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <div 
      className="theme-toggle"
      onClick={toggleTheme}
      role="button"
      tabIndex="0"
      aria-pressed={isDarkMode}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-knob">
        <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
      </div>
    </div>
  );
};

export default ThemeToggle;