import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';

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
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, date: Date) => void;
  getHabitStats: (habitId: string) => HabitStats;
  getHabitsForToday: () => Habit[];
  getCompletedHabitsForToday: () => Habit[];
  getRemainingHabitsForToday: () => Habit[];
  getCompletionStatus: (habitId: string, date: Date) => boolean;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

interface HabitsProviderProps {
  children: ReactNode;
}

export const HabitsProvider: React.FC<HabitsProviderProps> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const { getUserStorageKey } = useUser();

  // Load habits from localStorage on component mount
  useEffect(() => {
    const savedHabits = localStorage.getItem(getUserStorageKey('habits'));
    if (savedHabits) {
      const parsedHabits = JSON.parse(savedHabits);
      // Convert string dates back to Date objects
      const habitsWithDates = parsedHabits.map((habit: any) => ({
        ...habit,
        createdAt: new Date(habit.createdAt),
      }));
      setHabits(habitsWithDates);
    }
  }, [getUserStorageKey]);

  // Save habits to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(getUserStorageKey('habits'), JSON.stringify(habits));
  }, [habits, getUserStorageKey]);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Add a new habit
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: new Date(),
      completions: [],
      active: true,
    };
    setHabits([...habits, newHabit]);
  };

  // Update an existing habit
  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, ...updates } : habit
      )
    );
  };

  // Delete a habit
  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id));
  };

  // Toggle completion status for a habit on a specific date
  const toggleHabitCompletion = (habitId: string, date: Date) => {
    const dateStr = formatDate(date);
    
    setHabits(
      habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        
        const existingCompletion = habit.completions.find(
          (c) => c.date === dateStr
        );
        
        let newCompletions;
        
        if (existingCompletion) {
          // Toggle existing completion
          newCompletions = habit.completions.map((c) =>
            c.date === dateStr ? { ...c, completed: !c.completed } : c
          );
        } else {
          // Add new completion
          newCompletions = [
            ...habit.completions,
            { date: dateStr, completed: true },
          ];
        }
        
        return {
          ...habit,
          completions: newCompletions,
        };
      })
    );
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
  const getCompletionStatus = (habitId: string, date: Date): boolean => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return false;
    
    const dateStr = formatDate(date);
    const completion = habit.completions.find((c) => c.date === dateStr);
    
    return completion ? completion.completed : false;
  };

  // Calculate stats for a habit
  const getHabitStats = (habitId: string): HabitStats => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) {
      return {
        totalCompletions: 0,
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
      };
    }

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
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate,
    };
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
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