'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // === FIX : default 'light' au lieu de 'system' ===
  // Avant : 'system' = suit l'OS, ce qui causait du dark mode involontaire
  //         et rendait le texte invisible dans certaines pages (ex: chat IA)
  // Après : 'light' = blanc par défaut partout
  //         L'utilisateur peut toujours choisir 'dark' ou 'system' dans /parametres
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on client side
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme;
    // Si l'utilisateur a déjà choisi un thème avant, on respecte son choix
    // Sinon on reste sur 'light' (nouveau défaut)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeState(stored);
    }
  }, []);

  // Apply theme and listen for system changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const getResolvedTheme = () => {
      if (theme === 'system') return mediaQuery.matches ? 'dark' : 'light';
      return theme;
    };

    const applyTheme = (resolved: 'light' | 'dark') => {
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', 
        resolved === 'dark' ? '#0f172a' : '#2563eb'
      );
    };

    // Apply immediately on mount
    applyTheme(getResolvedTheme());

    const handler = (e: MediaQueryListEvent) => {
      if (theme === 'system') applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Provide context with default values during SSR/prerendering
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
