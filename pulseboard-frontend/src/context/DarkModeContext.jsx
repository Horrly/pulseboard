import { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext(null);

/**
 * DarkModeProvider — tracks dark/light preference and applies the `dark`
 * class to <html> so Tailwind's dark: variants activate.
 *
 * Priority order:
 *   1. localStorage value ('pb_theme' = 'dark' | 'light')
 *   2. OS prefers-color-scheme media query
 */
export function DarkModeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pb_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Keep <html class="dark"> in sync with state.
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pb_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Also listen for OS theme changes (user flips their system toggle).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only follow OS if the user hasn't manually picked a theme.
      if (!localStorage.getItem('pb_theme')) {
        setIsDark(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => setIsDark((v) => !v);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error('useDarkMode must be used inside <DarkModeProvider>');
  return ctx;
}
