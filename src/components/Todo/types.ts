export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  checklistId?: string;
} 