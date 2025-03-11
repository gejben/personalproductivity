import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoContextType {
  todos: TodoItem[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

interface TodoProviderProps {
  children: ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const { getUserStorageKey } = useUser();

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem(getUserStorageKey('todos'));
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, [getUserStorageKey]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(getUserStorageKey('todos'), JSON.stringify(todos));
  }, [todos, getUserStorageKey]);

  const addTodo = (text: string) => {
    if (text.trim() !== '') {
      const newTodo: TodoItem = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
      };
      setTodos([...todos, newTodo]);
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        toggleTodo,
        deleteTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

// Custom hook to use the todo context
export const useTodo = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};

export default TodoContext; 