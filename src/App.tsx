import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import Todo from './components/Todo/Todo';
import Notes from './components/Notes/Notes';
import Pomodoro from './components/Pomodoro/Pomodoro';
import Habits from './components/Habits/Habits';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import { UserProvider } from './contexts/UserContext';
import { TodoProvider } from './contexts/TodoContext';
import { NotesProvider } from './contexts/NotesContext';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { HabitsProvider } from './contexts/HabitsContext';
import { AuthProvider } from './contexts/AuthContext';
import './components/Auth/Loading.css';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <TodoProvider>
          <NotesProvider>
            <PomodoroProvider>
              <HabitsProvider>
                <Router>
                  <div className="App">
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
                      </Route>
                      
                      {/* Redirect any unknown routes to login */}
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </div>
                </Router>
              </HabitsProvider>
            </PomodoroProvider>
          </NotesProvider>
        </TodoProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
