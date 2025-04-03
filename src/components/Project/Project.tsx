import React, { useState, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { Task } from './types';
import './Project.css';

const Project: React.FC = () => {
  const { 
    projects, 
    activeProject, 
    setActiveProject,
    createProject,
    addTaskToProject,
    updateTask,
    getTimeReport
  } = useProject();

  const { isActive: isPomodoroActive, mode } = usePomodoro();
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [timeReport, setTimeReport] = useState<any>(null);
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (activeProject) {
      fetchTimeReport();
    }
  }, [activeProject, reportPeriod]);

  const fetchTimeReport = async () => {
    if (!activeProject) return;

    const now = new Date();
    let startDate = new Date();

    switch (reportPeriod) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const report = await getTimeReport(activeProject.id, startDate, now);
    setTimeReport(report);
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    const project = await createProject(newProjectTitle);
    setNewProjectTitle('');
    setActiveProject(project);
  };

  const handleCreateTask = async () => {
    if (!activeProject || !newTaskTitle.trim()) return;
    
    await addTaskToProject(activeProject.id, {
      title: newTaskTitle,
      status: 'todo'
    });
    
    setNewTaskTitle('');
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="project-container">
      <div className="project-header">
        <h2>Projects</h2>
        <div className="new-project">
          <input
            type="text"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="New project title"
          />
          <button onClick={handleCreateProject}>Create Project</button>
        </div>
      </div>

      <div className="project-list">
        {projects.map(project => (
          <div 
            key={project.id} 
            className={`project-item ${activeProject?.id === project.id ? 'active' : ''}`}
            onClick={() => setActiveProject(project)}
          >
            <h3>{project.title}</h3>
            <div className="project-stats">
              <span>Tasks: {project.tasks.length}</span>
              <span>Time: {formatTime(project.timeSpent)}</span>
            </div>
          </div>
        ))}
      </div>

      {activeProject && (
        <div className="active-project">
          <h3>{activeProject.title}</h3>
          
          <div className="project-tasks">
            <div className="new-task">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task title"
              />
              <button onClick={handleCreateTask}>Add Task</button>
            </div>

            <div className="task-list">
              {activeProject.tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <span>{formatTime(task.timeSpent)}</span>
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(activeProject.id, task.id, { status: e.target.value as Task['status'] })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="time-report">
            <h4>Time Report</h4>
            <div className="report-controls">
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as typeof reportPeriod)}
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {timeReport && (
              <div className="report-data">
                <div className="total-time">
                  Total Time: {formatTime(timeReport.totalTime)}
                </div>
                
                <div className="time-by-date">
                  <h5>Time by Date</h5>
                  {Object.entries(timeReport.byDate).map(([date, minutes]) => (
                    <div key={date} className="date-entry">
                      <span>{formatDate(date)}</span>
                      <span>{formatTime(minutes as number)}</span>
                    </div>
                  ))}
                </div>

                <div className="time-by-task">
                  <h5>Time by Task</h5>
                  {Object.entries(timeReport.byTask).map(([taskId, minutes]) => {
                    const task = activeProject.tasks.find(t => t.id === taskId);
                    return task ? (
                      <div key={taskId} className="task-entry">
                        <span>{task.title}</span>
                        <span>{formatTime(minutes as number)}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Project; 