import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { TodoProvider } from './contexts/TodoContext';
import { NotesProvider } from './contexts/NotesContext';
import { HabitsProvider } from './contexts/HabitsContext';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
// Initialize Firebase before rendering the app
import './firebase/initialize';

// Create a custom Material UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#ce93d8',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <UserProvider>
            <SettingsProvider>
              <TodoProvider>
                <NotesProvider>
                  <HabitsProvider>
                    <PomodoroProvider>
                      <App />
                    </PomodoroProvider>
                  </HabitsProvider>
                </NotesProvider>
              </TodoProvider>
            </SettingsProvider>
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
