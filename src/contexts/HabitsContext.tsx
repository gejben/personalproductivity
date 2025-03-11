import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Frequency types for habits
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

// Interface for tracking habit completions
export interface HabitCompletion {
  date: string; // ISO string format
  completed: boolean;
}

// Main habit interface
export interface Habit {
  id: string;
  name: string;
  description: string;
  frequencyType: FrequencyType;
  frequencyCount: number; // How many times per frequency period
  frequencyDays?: number[]; // For custom: days of week (0-6, 0 is Sunday)
  color: string;
  icon?: string;
  createdAt: Date;
  completions: HabitCompletion[];
  active: boolean;
}

// Stats for habit tracking
export interface HabitStats {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage
}

interface HabitsContextType {
  habits: Habit[];
  loading: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, date?: Date) => void;
  getHabitStats: (habit: Habit) => { completedCount: number; totalCount: number; completionRate: number };
  getHabitsForToday: () => Habit[];
  getCompletedHabitsForToday: () => Habit[];
  getRemainingHabitsForToday: () => Habit[];
  getCompletionStatus: (habit: Habit) => boolean;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

interface HabitsProviderProps {
  children: ReactNode;
}

export const HabitsProvider: React.FC<HabitsProviderProps> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();

  // Convert Firestore data to Habit object
  const convertFirestoreHabitToHabit = (data: any): Habit => {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      completions: data.completions || []
    };
  };

  // Load habits from Firestore when user changes
  useEffect(() => {
    if (!currentUser) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a reference to the user's habits collection
    const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
      const habitsData: Habit[] = [];
      snapshot.forEach((doc) => {
        const habitData = doc.data();
        habitsData.push(convertFirestoreHabitToHabit({
          id: doc.id,
          ...habitData
        }));
      });
      setHabits(habitsData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading habits from Firestore:", error);
      
      // Fallback to localStorage if Firestore fails
      const savedHabits = localStorage.getItem(getUserStorageKey('habits'));
      if (savedHabits) {
        try {
          const parsedHabits = JSON.parse(savedHabits);
          const habitsWithDates = parsedHabits.map((habit: any) => ({
            ...habit,
            createdAt: new Date(habit.createdAt),
          }));
          setHabits(habitsWithDates);
        } catch (e) {
          console.error("Error parsing habits from localStorage:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, getUserStorageKey]);

  // Save habits to localStorage as backup
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem(getUserStorageKey('habits'), JSON.stringify(habits));
    }
  }, [habits, getUserStorageKey]);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Add a new habit
  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => {
    if (!currentUser) return;

    try {
      // Create a new document reference with auto-generated ID
      const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
      const newHabitRef = doc(habitsRef);
      
      const newHabit: Habit = {
        ...habitData,
        id: newHabitRef.id,
        createdAt: new Date(),
        completions: [],
        active: true,
      };

      // Save to Firestore
      await setDoc(newHabitRef, {
        ...newHabit,
        createdAt: serverTimestamp()
      });

      // Update local state (will be updated by onSnapshot listener)
      // setHabits([...habits, newHabit]);
    } catch (error) {
      console.error("Error adding habit to Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      const newHabit: Habit = {
        ...habitData,
        id: Date.now().toString(),
        createdAt: new Date(),
        completions: [],
        active: true,
      };
      setHabits([...habits, newHabit]);
    }
  };

  // Update an existing habit
  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!currentUser) return;

    try {
      // Update in Firestore
      const habitRef = doc(db, 'users', currentUser.uid, 'habits', id);
      await updateDoc(habitRef, updates);

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error updating habit in Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setHabits(
        habits.map((habit) =>
          habit.id === id ? { ...habit, ...updates } : habit
        )
      );
    }
  };

  // Delete a habit
  const deleteHabit = async (id: string) => {
    if (!currentUser) return;

    try {
      // Delete from Firestore
      const habitRef = doc(db, 'users', currentUser.uid, 'habits', id);
      await deleteDoc(habitRef);

      // Delete will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error deleting habit from Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setHabits(habits.filter((habit) => habit.id !== id));
    }
  };

  // Toggle completion status for a habit on a specific date
  const toggleHabitCompletion = async (habitId: string, date?: Date) => {
    if (!currentUser) return;
    
    const dateStr = date ? formatDate(date) : formatDate(new Date());
    const habitToUpdate = habits.find(h => h.id === habitId);
    
    if (!habitToUpdate) return;
    
    const existingCompletion = habitToUpdate.completions.find(
      (c) => c.date === dateStr
    );
    
    let newCompletions: HabitCompletion[];
    
    if (existingCompletion) {
      // Toggle existing completion
      newCompletions = habitToUpdate.completions.map((c) =>
        c.date === dateStr ? { ...c, completed: !c.completed } : c
      );
    } else {
      // Add new completion
      newCompletions = [
        ...habitToUpdate.completions,
        { date: dateStr, completed: true },
      ];
    }
    
    try {
      // Update in Firestore
      const habitRef = doc(db, 'users', currentUser.uid, 'habits', habitId);
      await updateDoc(habitRef, {
        completions: newCompletions
      });

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error updating habit completion in Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setHabits(
        habits.map((habit) => {
          if (habit.id !== habitId) return habit;
          return {
            ...habit,
            completions: newCompletions,
          };
        })
      );
    }
  };

  // Check if a habit should be done on a specific day
  const shouldDoHabitOnDate = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0-6, 0 is Sunday
    
    switch (habit.frequencyType) {
      case 'daily':
        return true;
      case 'weekly':
        // If frequencyDays is specified, check if today is one of those days
        if (habit.frequencyDays && habit.frequencyDays.length > 0) {
          return habit.frequencyDays.includes(dayOfWeek);
        }
        // Otherwise, assume it can be done any day of the week
        return true;
      case 'monthly':
        // For monthly, we'll assume it can be done any day of the month
        return true;
      case 'custom':
        // For custom, check if today is one of the specified days
        return habit.frequencyDays?.includes(dayOfWeek) || false;
      default:
        return true;
    }
  };

  // Get habits that should be done today
  const getHabitsForToday = (): Habit[] => {
    const today = new Date();
    return habits.filter((habit) => habit.active && shouldDoHabitOnDate(habit, today));
  };

  // Get habits that have been completed today
  const getCompletedHabitsForToday = (): Habit[] => {
    const today = formatDate(new Date());
    return getHabitsForToday().filter((habit) =>
      habit.completions.some((c) => c.date === today && c.completed)
    );
  };

  // Get habits that still need to be completed today
  const getRemainingHabitsForToday = (): Habit[] => {
    const today = formatDate(new Date());
    return getHabitsForToday().filter(
      (habit) =>
        !habit.completions.some((c) => c.date === today && c.completed)
    );
  };

  // Get completion status for a habit on a specific date
  const getCompletionStatus = (habit: Habit): boolean => {
    const today = formatDate(new Date());
    const completion = habit.completions.find((c) => c.date === today);
    
    return completion ? completion.completed : false;
  };

  // Calculate stats for a habit
  const getHabitStats = (habit: Habit): { completedCount: number; totalCount: number; completionRate: number } => {
    // Total completions
    const totalCompletions = habit.completions.filter((c) => c.completed).length;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort completions by date
    const sortedCompletions = [...habit.completions]
      .filter((c) => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedCompletions.length > 0) {
      // Check if the most recent completion is today or yesterday
      const today = formatDate(new Date());
      const yesterday = formatDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      const mostRecentDate = sortedCompletions[0].date;
      
      if (mostRecentDate === today || mostRecentDate === yesterday) {
        // Current streak is active
        currentStreak = 1;
        
        // Count consecutive days
        for (let i = 1; i < sortedCompletions.length; i++) {
          const currentDate = new Date(sortedCompletions[i - 1].date);
          const prevDate = new Date(sortedCompletions[i].date);
          
          // Check if dates are consecutive
          const diffTime = currentDate.getTime() - prevDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedCompletions.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(sortedCompletions[i - 1].date);
        const prevDate = new Date(sortedCompletions[i].date);
        
        // Check if dates are consecutive
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          // Reset streak counter
          tempStreak = 1;
        }
      }
      
      // Update longest streak if current temp streak is longer
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Calculate completion rate
    // We'll count days since habit creation or last 30 days, whichever is shorter
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const habitStartDate = new Date(habit.createdAt);
    const startDate = habitStartDate > thirtyDaysAgo ? habitStartDate : thirtyDaysAgo;
    
    // Count days when habit should have been done
    let daysToComplete = 0;
    let daysCompleted = 0;
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      if (shouldDoHabitOnDate(habit, d)) {
        daysToComplete++;
        
        const dateStr = formatDate(d);
        const wasCompleted = habit.completions.some(
          (c) => c.date === dateStr && c.completed
        );
        
        if (wasCompleted) {
          daysCompleted++;
        }
      }
    }
    
    const completionRate = daysToComplete > 0 
      ? Math.round((daysCompleted / daysToComplete) * 100) 
      : 0;

    return {
      completedCount: daysCompleted,
      totalCount: daysToComplete,
      completionRate,
    };
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        loading,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitCompletion,
        getHabitStats,
        getHabitsForToday,
        getCompletedHabitsForToday,
        getRemainingHabitsForToday,
        getCompletionStatus,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

// Custom hook to use the habits context
export const useHabits = (): HabitsContextType => {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};

export default HabitsContext; 