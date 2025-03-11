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
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();

  // Convert Firestore data to TodoItem
  const convertFirestoreTodoToTodo = (data: any): TodoItem => {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : new Date(data.updatedAt || data.createdAt)
    };
  };

  // Load todos from Firestore when user changes
  useEffect(() => {
    if (!currentUser) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a reference to the user's todos collection
    const todosRef = collection(db, 'users', currentUser.uid, 'todos');
    
    // Create a query to order todos by creation date
    const todosQuery = query(todosRef, orderBy('createdAt', 'desc'));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
      const todosData: TodoItem[] = [];
      snapshot.forEach((doc) => {
        const todoData = doc.data();
        todosData.push(convertFirestoreTodoToTodo({
          id: doc.id,
          ...todoData
        }));
      });
      setTodos(todosData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading todos from Firestore:", error);
      
      // Fallback to localStorage if Firestore fails
      const savedTodos = localStorage.getItem(getUserStorageKey('todos'));
      if (savedTodos) {
        try {
          const parsedTodos = JSON.parse(savedTodos);
          // Add createdAt and updatedAt if they don't exist
          const todosWithDates = parsedTodos.map((todo: any) => ({
            ...todo,
            id: todo.id.toString(), // Convert number id to string
            createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
            updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : new Date()
          }));
          setTodos(todosWithDates);
        } catch (e) {
          console.error("Error parsing todos from localStorage:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
        text: text.trim(),
        completed: false,
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
        text: text.trim(),
        completed: false,
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