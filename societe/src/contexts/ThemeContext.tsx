import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLogger } from '../utils/logger';

// Logger pour le thème
const logger = createLogger('ThemeContext', 'ui');

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Par défaut en mode sombre, mais vérifier localStorage
    const saved = localStorage.getItem('darkMode');
    const initialMode = saved === null ? true : saved === 'true';
    logger.debug('Initialisation du thème', { mode: initialMode ? 'DARK' : 'LIGHT' });
    return initialMode;
  });

  useEffect(() => {
    // Appliquer le mode au chargement et à chaque changement
    logger.debug('Application du mode thème', { mode: darkMode ? 'DARK' : 'LIGHT' });
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    logger.info('Basculement du thème', { 
      from: darkMode ? 'DARK' : 'LIGHT',
      to: newMode ? 'DARK' : 'LIGHT'
    });
    
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    // Forcer l'application immédiate
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
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