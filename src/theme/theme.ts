import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9c27b0', // Deep purple
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    secondary: {
      main: '#f44336', // Red accent
      light: '#ff7961',
      dark: '#ba000d',
    },
    success: {
      main: '#00bcd4', // Cyan accent
      light: '#33c9dc',
      dark: '#008394',
    },
    background: {
      default: '#13111C', // Very dark purple
      paper: '#1A1625', // Slightly lighter dark purple
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 8px 16px rgba(156, 39, 176, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(145deg, rgba(26, 22, 37, 0.9) 0%, rgba(35, 30, 50, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#1A1625',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(19, 17, 28, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: 'rgba(156, 39, 176, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(156, 39, 176, 0.25)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: 40,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(45deg, #9c27b0 30%, #f44336 90%)',
        },
      },
    },
  },
});

export default theme; 