import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { darkTheme } from './theme';

interface ThemeContextValue {
  mode: 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const contextValue = useMemo(() => ({ mode: 'dark' as const }), []);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={darkTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
