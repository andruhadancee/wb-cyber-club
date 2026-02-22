import { createTheme, alpha } from '@mui/material/styles';

// ── Palette ──
const PRIMARY = '#7c3aed';
const PRIMARY_LIGHT = '#a78bfa';
const PRIMARY_DARK = '#5b21b6';
const SECONDARY = '#ec4899';
const SECONDARY_LIGHT = '#f472b6';

export const darkTheme = createTheme({
  cssVariables: false,
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1920 },
  },
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
          backgroundColor: '#09090b',
          colorScheme: 'dark',
        },
        body: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
          backgroundColor: 'transparent',
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderRadius: 14,
          borderColor: alpha('#fff', 0.06),
          backgroundColor: '#151517',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${alpha('#fff', 0.06)}`,
          backgroundColor: '#18181b',
          backgroundImage: 'linear-gradient(145deg, #1a1a1e 0%, #111113 100%)',
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
          backgroundColor: 'rgba(9,9,11,0.85)',
          backgroundImage: 'none',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backgroundColor: '#18181b',
          border: `1px solid ${alpha('#fff', 0.08)}`,
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
          border: `1px solid ${alpha('#fff', 0.06)}`,
          backgroundColor: '#151517',
          backgroundImage: 'none',
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
});
