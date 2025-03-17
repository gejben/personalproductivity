import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Todo from './components/Todo/Todo';
import Notes from './components/Notes/Notes';
import Pomodoro from './components/Pomodoro/Pomodoro';
import Habits from './components/Habits/Habits';
import Calendar from './components/Calendar/Calendar';
import SettingsPage from './components/Settings/SettingsPage';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import { Box } from '@mui/material';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/todo" element={
            <AppLayout>
              <Todo />
            </AppLayout>
          } />
          <Route path="/notes" element={
            <AppLayout>
              <Notes />
            </AppLayout>
          } />
          <Route path="/pomodoro" element={
            <AppLayout>
              <Pomodoro />
            </AppLayout>
          } />
          <Route path="/habits" element={
            <AppLayout>
              <Habits />
            </AppLayout>
          } />
          <Route path="/calendar" element={
            <AppLayout>
              <Calendar />
            </AppLayout>
          } />
          <Route path="/settings" element={
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          } />
        </Route>
        
        {/* Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Box>
  );
}

export default App;
