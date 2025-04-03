import React, { useState, useEffect } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { useProject } from '../../contexts/ProjectContext';
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

  const {
    projects,
    activeProject,
    setActiveProject,
    addTimeEntry
  } = useProject();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isActive && !timerStartTime) {
      setTimerStartTime(new Date());
    } else if (!isActive && timerStartTime && activeProject) {
      // Record time entry when timer stops
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - timerStartTime.getTime()) / 60000); // Convert to minutes

      if (duration > 0) {
        addTimeEntry({
          projectId: activeProject.id,
          taskId: selectedTaskId || undefined,
          startTime: timerStartTime,
          endTime,
          duration,
          source: 'pomodoro',
          description: `Pomodoro session - ${getModeLabel(mode)}`
        });
      }

      setTimerStartTime(null);
    }
  }, [isActive, timerStartTime, activeProject, selectedTaskId, mode, addTimeEntry, getModeLabel]);

  const handleToggleTimer = () => {
    if (!isActive && !activeProject) {
      alert('Please select a project before starting the timer');
      return;
    }
    toggleTimer();
  };

  return (
    <div className="pomodoro-container">
      <h2>Pomodoro Timer</h2>
      
      <div className="project-selection">
        <select
          value={activeProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            setActiveProject(project);
            setSelectedTaskId('');
          }}
          disabled={isActive}
        >
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>

        {activeProject && (
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={isActive}
          >
            <option value="">No specific task</option>
            {activeProject.tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="timer-modes">
        <button 
          className={mode === 'work' ? 'active' : ''} 
          onClick={() => changeMode('work')}
          disabled={isActive}
        >
          Work
        </button>
        <button 
          className={mode === 'shortBreak' ? 'active' : ''} 
          onClick={() => changeMode('shortBreak')}
          disabled={isActive}
        >
          Short Break
        </button>
        <button 
          className={mode === 'longBreak' ? 'active' : ''} 
          onClick={() => changeMode('longBreak')}
          disabled={isActive}
        >
          Long Break
        </button>
      </div>
      
      <div className="timer-display">
        {formatTime()}
      </div>
      
      <div className="timer-controls">
        <button onClick={handleToggleTimer}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} disabled={isActive}>Reset</button>
      </div>
      
      <div className="timer-info">
        <p>Current Mode: {getModeLabel(mode)}</p>
        <p>Completed Cycles: {cycles}</p>
        {activeProject && (
          <p>Project: {activeProject.title} {selectedTaskId && `- ${activeProject.tasks.find(t => t.id === selectedTaskId)?.title}`}</p>
        )}
      </div>
    </div>
  );
};

export default Pomodoro; 