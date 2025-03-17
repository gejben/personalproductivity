import React from 'react';
import './Dashboard.css';
import Todo from '../Todo/Todo';
import Notes from '../Notes/Notes';
import Pomodoro from '../Pomodoro/Pomodoro';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useHabits } from '../../contexts';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  // Access data from contexts to demonstrate they're available globally
  const { getHabitsForToday, getCompletedHabitsForToday, getRemainingHabitsForToday } = useHabits();

  const habitsForToday = getHabitsForToday();
  const completedHabits = getCompletedHabitsForToday();
  const remainingHabits = getRemainingHabitsForToday();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Personal Productivity Hub</h1>
        <p>Manage your tasks, notes, habits, and time all in one place</p>
      </header>
      
      <div className="dashboard-habits-summary">
        <h2>Today's Habits</h2>
        <div className="habits-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: habitsForToday.length > 0 
                  ? `${(completedHabits.length / habitsForToday.length) * 100}%` 
                  : '0%' 
              }}
            ></div>
          </div>
          <div className="progress-stats">
            <span>Progress</span>
            {remainingHabits.length > 0 && (
              <Link to="/habits" className="habits-link">
                View Habits
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-item">
          <Todo />
        </div>
        
        <div className="dashboard-item">
          <Pomodoro />
        </div>
        
        <div className="dashboard-item notes-section">
          <Notes />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 