import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  getDoc,
  where,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/initialize';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  tags: string[];
  userId: string;
  createdAt: any;
  updatedAt: any;
}

interface TodoContextType {
  todos: TodoItem[];
  loading: boolean;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

interface TodoProviderProps {
  children: ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();

  // Function to convert Firestore data to TodoItem
  const convertFirestoreTodoToTodo = (data: DocumentData & { id: string }): TodoItem => {
    return {
      id: data.id,
      title: data.title || '',
      description: data.description || '',
      completed: data.completed || false,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || null,
      tags: data.tags || [],
      userId: data.userId || '',
      createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
    };
  };

  // Load todos from Firestore when user changes
  useEffect(() => {
    const fetchTodos = async () => {
      if (!currentUser) {
        setTodos([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Reference to the user's todos collection
        const todosRef = collection(db, 'users', currentUser.uid, 'todos');
        const q = query(todosRef, orderBy('createdAt', 'desc'));
        
        // Set up a snapshot listener for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const todoData: TodoItem[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            todoData.push(convertFirestoreTodoToTodo({
              id: doc.id,
              ...data
            }));
          });
          
          setTodos(todoData);
          setLoading(false);
          
          // Save to localStorage as backup
          localStorage.setItem(getUserStorageKey('todos'), JSON.stringify(todoData));
        }, (error) => {
          console.error("Error fetching todos:", error);
          setError("Failed to fetch todos. Please try again later.");
          setLoading(false);
          
          // Try to load from localStorage if available
          const savedTodos = localStorage.getItem(getUserStorageKey('todos'));
          if (savedTodos) {
            try {
              setTodos(JSON.parse(savedTodos));
            } catch (e) {
              console.error("Error parsing todos from localStorage:", e);
            }
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up todos listener:", error);
        setLoading(false);
        return () => {};
      }
    };
    
    fetchTodos();
  }, [currentUser, getUserStorageKey]);

  // Save todos to localStorage as backup
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem(getUserStorageKey('todos'), JSON.stringify(todos));
    }
  }, [todos, getUserStorageKey]);

  const addTodo = async (text: string) => {
    if (!currentUser || text.trim() === '') return;

    try {
      // Create a new document reference with auto-generated ID
      const todosRef = collection(db, 'users', currentUser.uid, 'todos');
      const newTodoRef = doc(todosRef);
      
      const now = new Date();
      const newTodo: TodoItem = {
        id: newTodoRef.id,
        title: text.trim(),
        description: '',
        completed: false,
        priority: 'medium',
        dueDate: null,
        tags: [],
        userId: currentUser.uid,
        createdAt: now,
        updatedAt: now
      };

      // Save to Firestore
      await setDoc(newTodoRef, {
        ...newTodo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error adding todo to Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        title: text.trim(),
        description: '',
        completed: false,
        priority: 'medium',
        dueDate: null,
        tags: [],
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTodos([...todos, newTodo]);
    }
  };

  const toggleTodo = async (id: string) => {
    if (!currentUser) return;

    const todoToUpdate = todos.find(todo => todo.id === id);
    if (!todoToUpdate) return;

    try {
      // Update in Firestore
      const todoRef = doc(db, 'users', currentUser.uid, 'todos', id);
      await updateDoc(todoRef, {
        completed: !todoToUpdate.completed,
        updatedAt: serverTimestamp()
      });

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error updating todo in Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { 
            ...todo, 
            completed: !todo.completed,
            updatedAt: new Date()
          } : todo
        )
      );
    }
  };

  const deleteTodo = async (id: string) => {
    if (!currentUser) return;

    try {
      // Delete from Firestore
      const todoRef = doc(db, 'users', currentUser.uid, 'todos', id);
      await deleteDoc(todoRef);

      // Delete will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error deleting todo from Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setTodos(todos.filter((todo) => todo.id !== id));
    }
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        loading,
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