import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import './Pomodoro.css';

const Pomodoro: React.FC = () => {
  const { 
    mode, 
    cycles, 
    isActive, 
    toggleTimer, 
    resetTimer, 
    changeMode, 
    formatTime,
    getModeLabel
  } = usePomodoro();

  return (
    <div className="pomodoro-container">
      <h2>Pomodoro Timer</h2>
      
      <div className="timer-modes">
        <button 
          className={mode === 'work' ? 'active' : ''} 
          onClick={() => changeMode('work')}
        >
          Work
        </button>
        <button 
          className={mode === 'shortBreak' ? 'active' : ''} 
          onClick={() => changeMode('shortBreak')}
        >
          Short Break
        </button>
        <button 
          className={mode === 'longBreak' ? 'active' : ''} 
          onClick={() => changeMode('longBreak')}
        >
          Long Break
        </button>
      </div>
      
      <div className="timer-display">
        {formatTime()}
      </div>
      
      <div className="timer-controls">
        <button onClick={toggleTimer}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer}>Reset</button>
      </div>
      
      <div className="timer-info">
        <p>Current Mode: {getModeLabel(mode)}</p>
        <p>Completed Cycles: {cycles}</p>
      </div>
    </div>
  );
};

export default Pomodoro; 