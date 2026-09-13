'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isCustom: boolean;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isCustom, setIsCustom] = useState(false);

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('ma-boutique-primary-color');
    const savedTheme = localStorage.getItem('ma-boutique-theme') as 'light' | 'dark' | null;
    const savedIsCustom = localStorage.getItem('ma-boutique-is-custom');

    if (savedColor) {
      setPrimaryColor(savedColor);
      setIsCustom(savedIsCustom === 'true');
    }
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Vérifier les préférences système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
      }
    }
  }, []);

  // Appliquer les styles CSS
  useEffect(() => {
    const root = document.documentElement;
    
    // Appliquer la couleur primaire
    root.style.setProperty('--primary-color', primaryColor);
    
    // Appliquer le thème
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('ma-boutique-primary-color', primaryColor);
    localStorage.setItem('ma-boutique-theme', theme);
    localStorage.setItem('ma-boutique-is-custom', isCustom.toString());
  }, [primaryColor, theme, isCustom]);

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    setIsCustom(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const resetToDefault = () => {
    setPrimaryColor('#2563eb');
    setIsCustom(false);
    setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{
      primaryColor,
      setPrimaryColor: handleColorChange,
      theme,
      toggleTheme,
      isCustom,
      resetToDefault
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}