'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  mounted: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  mounted: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'light' to match server render
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // One-time hydration sync: the component must render 'light' on the server
    // to match SSR, then adopt whatever the pre-paint inline script wrote to the
    // <html data-theme> attribute. This is a legitimate "sync from an external
    // system on mount" case, so the set-state-in-effect rule is disabled here.
    const current = document.documentElement.getAttribute('data-theme') as Theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme((prev) => (current && current !== prev ? current : prev));
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
