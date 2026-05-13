import { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark';

export const lightColors = {
  bg: '#F8FAFC',
  bgCard: '#FFFFFF',
  bgSecondary: '#F1F5F9',
  bgInput: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  tabBar: '#FFFFFF',
  tabBorder: '#E2E8F0',
  brand: '#7C3AED',
  brandLight: '#EDE9FE',
  brandText: '#6D28D9',
  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
  refreshTint: '#7C3AED',
};

export const darkColors = {
  bg: '#0F172A',
  bgCard: '#1E293B',
  bgSecondary: '#172033',
  bgInput: '#0F172A',
  border: '#334155',
  borderStrong: '#475569',
  text: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  tabBar: '#0F172A',
  tabBorder: '#1E293B',
  brand: '#7C3AED',
  brandLight: '#2D1B69',
  brandText: '#A78BFA',
  success: '#10B981',
  danger: '#F87171',
  warning: '#FBBF24',
  refreshTint: '#7C3AED',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  colors: darkColors,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
