import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  // Always enforce light mode
  const isDarkMode = false;
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  const toggleTheme = () => {
    // No-op
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
