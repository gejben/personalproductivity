export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  timeSpent: number; // in minutes
  timeEntries: TimeEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId: string;
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  description?: string;
  source: 'pomodoro' | 'manual';
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  tasks: Task[];
  goals: string[]; // Array of goal IDs
  checklists: string[]; // Array of checklist IDs
  todos: string[]; // Array of todo IDs
  timeSpent: number; // Total time spent in minutes
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  sharedWith: string[];
}

export interface TimeReport {
  totalTime: number;
  byTask: {
    [taskId: string]: number;
  };
  byDate: {
    [date: string]: number;
  };
  entries: TimeEntry[];
} 