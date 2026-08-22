'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ThemePreference } from '@/types';

interface ThemeContextValue {
  theme: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

const applyTheme = (theme: ThemePreference) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dark is the default here — the palette was designed dark-first.
  const [theme, setThemeState] = useState<ThemePreference>('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as ThemePreference | null;
    const initial =
      stored ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    applyTheme(next);
    window.localStorage.setItem('theme', next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
