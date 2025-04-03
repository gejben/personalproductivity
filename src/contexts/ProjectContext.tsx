import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getFirestore } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Project, Task, TimeEntry, TimeReport } from '../components/Project/types';

interface ProjectContextType {
  projects: Project[];
  activeProject?: Project;
  setActiveProject: (project: Project | undefined) => void;
  createProject: (title: string, description?: string) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  addTaskToProject: (projectId: string, task: Omit<Task, 'id' | 'timeEntries' | 'timeSpent' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
  getTimeReport: (projectId: string, startDate?: Date, endDate?: Date) => Promise<TimeReport>;
  addGoalToProject: (projectId: string, goalId: string) => Promise<void>;
  addChecklistToProject: (projectId: string, checklistId: string) => Promise<void>;
  addTodoToProject: (projectId: string, todoId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project>();
  const { currentUser } = useAuth();
  const db = getFirestore();

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) return;

      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, 
        where('ownerId', '==', currentUser.uid),
        where('status', 'in', ['active', 'pending', 'completed'])
      );

      const querySnapshot = await getDocs(q);
      const fetchedProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Project[];

      setProjects(fetchedProjects);
    };

    fetchProjects();
  }, [currentUser, db]);

  const createProject = async (title: string, description?: string): Promise<Project> => {
    if (!currentUser) throw new Error('User not authenticated');

    const newProject: Omit<Project, 'id'> = {
      title,
      description: description || undefined,
      status: 'active',
      tasks: [],
      goals: [],
      checklists: [],
      todos: [],
      timeSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: currentUser.uid,
      sharedWith: []
    };

    const docRef = await addDoc(collection(db, 'projects'), newProject);
    const project = { ...newProject, id: docRef.id } as Project;
    setProjects(prev => [...prev, project]);
    return project;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { ...updates, updatedAt: new Date() });
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const addTaskToProject = async (projectId: string, taskData: Omit<Task, 'id' | 'timeEntries' | 'timeSpent' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const task: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      timeEntries: [],
      timeSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    await updateDoc(doc(db, 'projects', projectId), {
      tasks: [...project.tasks, task],
      updatedAt: new Date()
    });

    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      tasks: [...p.tasks, task]
    } : p));

    return task;
  };

  const updateTask = async (projectId: string, taskId: string, updates: Partial<Task>) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t
    );

    await updateDoc(doc(db, 'projects', projectId), {
      tasks: updatedTasks,
      updatedAt: new Date()
    });

    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      tasks: updatedTasks
    } : p));
  };

  const addTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    const timeEntry: TimeEntry = {
      ...entry,
      id: crypto.randomUUID()
    };

    const project = projects.find(p => p.id === entry.projectId);
    if (!project) throw new Error('Project not found');

    const updatedTasks = project.tasks.map(task => {
      if (task.id === entry.taskId) {
        return {
          ...task,
          timeEntries: [...task.timeEntries, timeEntry],
          timeSpent: task.timeSpent + entry.duration,
          updatedAt: new Date()
        };
      }
      return task;
    });

    await updateDoc(doc(db, 'projects', entry.projectId), {
      tasks: updatedTasks,
      timeSpent: project.timeSpent + entry.duration,
      updatedAt: new Date()
    });

    setProjects(prev => prev.map(p => p.id === entry.projectId ? {
      ...p,
      tasks: updatedTasks,
      timeSpent: p.timeSpent + entry.duration
    } : p));
  };

  const getTimeReport = async (projectId: string, startDate?: Date, endDate?: Date): Promise<TimeReport> => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const allEntries = project.tasks.flatMap(task => 
      task.timeEntries.map(entry => ({
        ...entry,
        taskId: task.id
      }))
    );

    const filteredEntries = allEntries.filter(entry => {
      if (!startDate && !endDate) return true;
      if (startDate && entry.startTime < startDate) return false;
      if (endDate && entry.endTime > endDate) return false;
      return true;
    });

    const byTask: { [taskId: string]: number } = {};
    const byDate: { [date: string]: number } = {};
    let totalTime = 0;

    filteredEntries.forEach(entry => {
      totalTime += entry.duration;
      
      if (entry.taskId) {
        byTask[entry.taskId] = (byTask[entry.taskId] || 0) + entry.duration;
      }

      const date = entry.startTime.toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + entry.duration;
    });

    return {
      totalTime,
      byTask,
      byDate,
      entries: filteredEntries
    };
  };

  const addGoalToProject = async (projectId: string, goalId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    await updateDoc(doc(db, 'projects', projectId), {
      goals: [...project.goals, goalId],
      updatedAt: new Date()
    });

    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      goals: [...p.goals, goalId]
    } : p));
  };

  const addChecklistToProject = async (projectId: string, checklistId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    await updateDoc(doc(db, 'projects', projectId), {
      checklists: [...project.checklists, checklistId],
      updatedAt: new Date()
    });

    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      checklists: [...p.checklists, checklistId]
    } : p));
  };

  const addTodoToProject = async (projectId: string, todoId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    await updateDoc(doc(db, 'projects', projectId), {
      todos: [...project.todos, todoId],
      updatedAt: new Date()
    });

    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      todos: [...p.todos, todoId]
    } : p));
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      setActiveProject,
      createProject,
      updateProject,
      addTaskToProject,
      updateTask,
      addTimeEntry,
      getTimeReport,
      addGoalToProject,
      addChecklistToProject,
      addTodoToProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}; 