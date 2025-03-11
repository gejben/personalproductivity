import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <>
      <nav className="app-nav">
        <div className="app-logo">
          <Link to="/">Productivity Hub</Link>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/todo">Todo</Link>
          </li>
          <li>
            <Link to="/notes">Notes</Link>
          </li>
          <li>
            <Link to="/pomodoro">Pomodoro</Link>
          </li>
          <li>
            <Link to="/habits">Habits</Link>
          </li>
          <li>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <main className="app-content">
        {children}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Personal Productivity Hub</p>
      </footer>
    </>
  );
};

export default AppLayout; 