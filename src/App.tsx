import { Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Todo from './components/Todo/Todo';
import Notes from './components/Notes/Notes';
import Habits from './components/Habits/Habits';
import Calendar from './components/Calendar/Calendar';
import SettingsPage from './components/Settings/SettingsPage';
import { GoalsProvider } from './contexts/GoalsContext';
import Goals from './components/Goals/Goals';
import Checklist from './components/Checklist/Checklist';
import Pomodoro from './components/Pomodoro/Pomodoro';
import { PomodoroProvider } from './contexts/PomodoroContext';
import Project from './components/Project/Project';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout><Outlet /></AppLayout>}>
            <Route element={
              <ProjectProvider>
                <PomodoroProvider>
                  <GoalsProvider>
                    <Outlet />
                  </GoalsProvider>
                </PomodoroProvider>
              </ProjectProvider>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/todo" element={<Todo />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/checklists" element={<Checklist />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/projects" element={<Project />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
