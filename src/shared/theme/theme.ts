import { createTheme, type ThemeOptions, alpha } from '@mui/material/styles';

// ── Palette ──
const PRIMARY = '#7c3aed';
const PRIMARY_LIGHT = '#a78bfa';
const PRIMARY_DARK = '#5b21b6';
const SECONDARY = '#ec4899';
const SECONDARY_LIGHT = '#f472b6';

const commonOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 800, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
          backgroundColor: 'transparent !important',
        },
        '::selection': {
          backgroundColor: alpha(PRIMARY, 0.3),
          color: '#fff',
        },
        '::-webkit-scrollbar': {
          width: 8,
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          background: alpha(PRIMARY, 0.3),
          borderRadius: 4,
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: alpha(PRIMARY, 0.5),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 10,
          transition: 'all 0.25s ease',
        },
        contained: {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
          boxShadow: `0 4px 14px ${alpha(PRIMARY, 0.35)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${PRIMARY_LIGHT} 0%, ${PRIMARY} 100%)`,
            boxShadow: `0 6px 20px ${alpha(PRIMARY, 0.5)}`,
            transform: 'translateY(-1px)',
          },
        },
        containedSuccess: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: `0 4px 14px ${alpha('#10b981', 0.35)}`,
          '&:hover': {
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            boxShadow: `0 6px 20px ${alpha('#10b981', 0.5)}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
            transform: 'translateY(-1px)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease',
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(PRIMARY, 0.15)}`,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: '10px 10px 0 0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderRadius: 14,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: `0 4px 14px ${alpha(PRIMARY, 0.35)}`,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '14px !important',
          '&:before': { display: 'none' },
          overflow: 'hidden',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
        },
      },
    },
  },
};

export const darkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY, light: PRIMARY_LIGHT, dark: PRIMARY_DARK },
    secondary: { main: SECONDARY, light: SECONDARY_LIGHT, dark: '#be185d' },
    background: {
      default: '#09090b',
      paper: '#111113',
    },
    text: {
      primary: '#fafafa',
      secondary: '#a1a1aa',
    },
    divider: alpha('#fff', 0.06),
    action: {
      hover: alpha(PRIMARY, 0.08),
      selected: alpha(PRIMARY, 0.12),
    },
  },
  components: {
    ...commonOptions.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${alpha('#fff', 0.06)}`,
          background: `linear-gradient(145deg, ${alpha('#18181b', 0.8)} 0%, ${alpha('#09090b', 0.9)} 100%)`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(PRIMARY, 0.3),
            boxShadow: `0 8px 30px ${alpha(PRIMARY, 0.15)}, 0 0 0 1px ${alpha(PRIMARY, 0.1)}`,
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha('#09090b', 0.8),
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: '#18181b',
          border: `1px solid ${alpha('#fff', 0.08)}`,
          backgroundImage: 'none',
          backdropFilter: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderRadius: 14,
          borderColor: alpha('#fff', 0.06),
          background: alpha('#18181b', 0.5),
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '14px !important',
          border: `1px solid ${alpha('#fff', 0.06)}`,
          background: alpha('#18181b', 0.5),
          backdropFilter: 'blur(12px)',
          '&:before': { display: 'none' },
          overflow: 'hidden',
        },
      },
    },
  },
});
