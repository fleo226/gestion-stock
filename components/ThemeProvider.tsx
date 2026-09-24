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
  // === FORCE 'light' BY DEFAULT ===
  // Plus de 'system' qui suivait l'OS et causait du dark mode involontaire
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on client side
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    
    // On ne respecte QUE les choix explicites 'light' ou 'dark'
    // Si l'ancien code avait sauvegardé 'system', on l'efface
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    } else if (stored === 'system') {
      // Nettoie l'ancienne valeur 'system' qui posait problème
      localStorage.removeItem('theme');
    }
    
    // === SAFETY NET : force remove 'dark' class au montage ===
    // Même si l'OS est en dark, on commence en light
    document.documentElement.classList.remove('dark');
  }, []);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const getResolvedTheme = () => {
      if (theme === 'system') return mediaQuery.matches ? 'dark' : 'light';
      return theme;
    };

    const applyTheme = (resolved: 'light' | 'dark') => {
      setResolvedTheme(resolved);
      // Force remove 'dark' d'abord, puis ajoute si nécessaire
      document.documentElement.classList.remove('dark');
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      }
      // Met à jour la meta theme-color pour la barre du navigateur
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#2563eb');
      }
    };

    // Applique immédiatement
    applyTheme(getResolvedTheme());

    // Écoute les changements de préférence système (seulement si theme='system')
    const handler = (e: MediaQueryListEvent) => {
      if (theme === 'system') applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Sauvegarde dans localStorage
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
      localStorage.setItem('theme', newTheme);
    }
    
    // === APPLIQUE IMMÉDIATEMENT (pas d'attente useEffect) ===
    // C'est ce qui manquait : maintenant le clic "Clair" marche instantanément
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setResolvedTheme('light');
    } else if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setResolvedTheme('dark');
    } else if (newTheme === 'system') {
      // Pour 'system', on doit attendre le useEffect pour appliquer
      // (car il faut vérifier matchMedia)
    }
  };

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
