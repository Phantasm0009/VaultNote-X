import { useState, useEffect } from 'react';

const THEME_KEY = 'vaultnote-theme';

export const useTheme = () => {
  // Check for saved preference first, then system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());

  useEffect(() => {
    // Add or remove the .dark-theme class from the body
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Save the preference to localStorage
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return { isDarkMode, toggleTheme };
};