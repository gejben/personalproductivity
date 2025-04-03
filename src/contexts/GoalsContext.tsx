import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { useAuth } from './AuthContext';
import { useHabits } from './HabitsContext';
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
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { db } from '../firebase/initialize';

// Types for goal targets
export type GoalTargetType = 'count' | 'percentage' | 'streak' | 'composite';
export type GoalPeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// Interface for goal targets
export interface GoalTarget {
  type: GoalTargetType;
  value: number;
  period?: GoalPeriodType;
  periodValue?: number; // For custom periods
  subTargets?: GoalTarget[]; // For composite goals
}

// Interface for goal items (habits or tasks)
export interface GoalItem {
  id: string;
  type: 'habit' | 'task';
  weight?: number; // For weighted contributions to composite goals
}

// Interface for goal object
export interface Goal {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  target: GoalTarget;
  items: GoalItem[];
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  isArchived?: boolean;
  color?: string;
  progress?: number;
  lastUpdated?: Date;
}

// Interface for goal statistics
export interface GoalStats {
  currentValue: number;
  targetValue: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  lastUpdated: Date;
}

// Define context interface
interface GoalsContextType {
  goals: Goal[];
  loading: boolean;
  addGoal: (goalData: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'lastUpdated'>) => Promise<string>;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getGoalStats: (goal: Goal) => GoalStats;
  getGoalsByCategory: (categoryId: string) => Goal[];
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getFailedGoals: () => Goal[];
  archiveGoal: (id: string) => Promise<void>;
  unarchiveGoal: (id: string) => Promise<void>;
  addItemToGoal: (goalId: string, itemId: string, itemType: 'habit' | 'task', weight?: number) => Promise<void>;
  removeItemFromGoal: (goalId: string, itemId: string) => Promise<void>;
  updateItemWeight: (goalId: string, itemId: string, weight: number) => Promise<void>;
}

// Create the context
const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

// Provider component
export const GoalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();
  const { habits, getHabitStats } = useHabits();

  // Helper function to safely get Firestore instance
  const getFirestore = (): Firestore => {
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    return db;
  };

  // Convert Firestore data to Goal object
  const convertFirestoreGoalToGoal = (data: any, docId: string): Goal => {
    const baseData = {
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      startDate: data.startDate instanceof Timestamp 
        ? data.startDate.toDate() 
        : data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate instanceof Timestamp 
        ? data.endDate.toDate() 
        : data.endDate ? new Date(data.endDate) : undefined,
      items: data.items || []
    };

    return {
      id: docId,
      ...data,
      ...baseData
    };
  };

  // Fetch goals from Firestore
  useEffect(() => {
    if (!currentUser) return;

    try {
      const firestore = getFirestore();
      const goalsRef = collection(firestore, 'users', currentUser.uid, 'goals');
      
      const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => 
          convertFirestoreGoalToGoal(doc.data(), doc.id)
        );
        setGoals(goalsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching goals:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing goals listener:", error);
      setLoading(false);
    }
  }, [currentUser]);

  // Save goals to localStorage as backup
  useEffect(() => {
    if (goals.length > 0) {
      try {
        localStorage.setItem(getUserStorageKey('goals'), JSON.stringify(goals));
      } catch (error) {
        console.error("Error saving goals to localStorage:", error);
      }
    }
  }, [goals, getUserStorageKey]);

  // Add a new goal
  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'lastUpdated'>): Promise<string> => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      const firestore = getFirestore();
      const goalsRef = collection(firestore, 'users', currentUser.uid, 'goals');
      const newGoalRef = doc(goalsRef);
      
      const newGoal: Omit<Goal, 'id'> = {
        ...goalData,
        createdAt: new Date(),
        progress: 0,
        lastUpdated: new Date()
      };
      
      await setDoc(newGoalRef, newGoal);
      return newGoalRef.id;
    } catch (error) {
      console.error("Error adding goal to Firestore:", error);
      throw error;
    }
  };

  // Update an existing goal
  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<void> => {
    if (!currentUser) return;

    try {
      const firestore = getFirestore();
      const goalRef = doc(firestore, 'users', currentUser.uid, 'goals', id);
      await updateDoc(goalRef, {
        ...updates,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error("Error updating goal in Firestore:", error);
      throw error;
    }
  };

  // Delete a goal
  const deleteGoal = async (id: string) => {
    if (!currentUser) return;

    try {
      const firestore = getFirestore();
      const goalRef = doc(firestore, 'users', currentUser.uid, 'goals', id);
      await deleteDoc(goalRef);
    } catch (error) {
      console.error("Error deleting goal from Firestore:", error);
      throw error;
    }
  };

  // Archive a goal
  const archiveGoal = async (id: string) => {
    await updateGoal(id, { isArchived: true });
  };

  // Unarchive a goal
  const unarchiveGoal = async (id: string) => {
    await updateGoal(id, { isArchived: false });
  };

  // Calculate goal statistics
  const getGoalStats = (goal: Goal): GoalStats => {
    const now = new Date();
    let currentValue = 0;
    let targetValue = goal.target.value;

    // Calculate current value based on target type
    switch (goal.target.type) {
      case 'count':
        // Count completed items in the period
        currentValue = goal.items.reduce((acc, item) => {
          if (item.type === 'habit') {
            const habit = habits.find(h => h.id === item.id);
            if (habit) {
              const stats = getHabitStats(habit);
              return acc + stats.completed;
            }
          }
          // TODO: Add task completion counting when tasks are implemented
          return acc;
        }, 0);
        break;

      case 'percentage':
        // Calculate percentage of completed items
        const totalItems = goal.items.length;
        if (totalItems > 0) {
          const completedItems = goal.items.filter(item => {
            if (item.type === 'habit') {
              const habit = habits.find(h => h.id === item.id);
              if (habit) {
                const stats = getHabitStats(habit);
                return stats.completionRate >= 100;
              }
            }
            // TODO: Add task completion checking when tasks are implemented
            return false;
          }).length;
          currentValue = (completedItems / totalItems) * 100;
        }
        break;

      case 'streak':
        // Find the longest streak among items
        currentValue = Math.max(...goal.items.map(item => {
          if (item.type === 'habit') {
            const habit = habits.find(h => h.id === item.id);
            if (habit) {
              const stats = getHabitStats(habit);
              return stats.streak;
            }
          }
          // TODO: Add task streak checking when tasks are implemented
          return 0;
        }));
        break;

      case 'composite':
        // Calculate weighted average of sub-targets
        if (goal.target.subTargets) {
          let totalWeight = 0;
          let weightedSum = 0;

          goal.target.subTargets.forEach((subTarget, index) => {
            const item = goal.items[index];
            if (item) {
              const weight = item.weight || 1;
              totalWeight += weight;

              if (item.type === 'habit') {
                const habit = habits.find(h => h.id === item.id);
                if (habit) {
                  const stats = getHabitStats(habit);
                  weightedSum += (stats.completionRate / 100) * weight;
                }
              }
              // TODO: Add task progress calculation when tasks are implemented
            }
          });

          if (totalWeight > 0) {
            currentValue = (weightedSum / totalWeight) * 100;
          }
        }
        break;
    }

    // Calculate progress percentage
    const progress = Math.min(100, (currentValue / targetValue) * 100);

    // Determine status
    let status: 'not_started' | 'in_progress' | 'completed' | 'failed' = 'not_started';
    if (progress > 0) status = 'in_progress';
    if (progress >= 100) status = 'completed';
    if (goal.endDate && now > goal.endDate && progress < 100) status = 'failed';

    return {
      currentValue,
      targetValue,
      progress,
      status,
      lastUpdated: now
    };
  };

  // Get goals by category
  const getGoalsByCategory = (categoryId: string): Goal[] => {
    return goals.filter(goal => !goal.isArchived && goal.categoryId === categoryId);
  };

  // Get active goals
  const getActiveGoals = (): Goal[] => {
    return goals.filter(goal => !goal.isArchived && getGoalStats(goal).status === 'in_progress');
  };

  // Get completed goals
  const getCompletedGoals = (): Goal[] => {
    return goals.filter(goal => !goal.isArchived && getGoalStats(goal).status === 'completed');
  };

  // Get failed goals
  const getFailedGoals = (): Goal[] => {
    return goals.filter(goal => !goal.isArchived && getGoalStats(goal).status === 'failed');
  };

  // Add item to goal
  const addItemToGoal = async (goalId: string, itemId: string, itemType: 'habit' | 'task', weight?: number): Promise<void> => {
    if (!currentUser) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const newItem: GoalItem = {
        id: itemId,
        type: itemType,
        weight
      };

      const updatedItems = [...goal.items, newItem];
      await updateGoal(goalId, { items: updatedItems });
    } catch (error) {
      console.error("Error adding item to goal:", error);
      throw error;
    }
  };

  // Remove item from goal
  const removeItemFromGoal = async (goalId: string, itemId: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const updatedItems = goal.items.filter(item => item.id !== itemId);
      await updateGoal(goalId, { items: updatedItems });
    } catch (error) {
      console.error("Error removing item from goal:", error);
      throw error;
    }
  };

  // Update item weight
  const updateItemWeight = async (goalId: string, itemId: string, weight: number): Promise<void> => {
    if (!currentUser) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const updatedItems = goal.items.map(item => 
        item.id === itemId ? { ...item, weight } : item
      );
      await updateGoal(goalId, { items: updatedItems });
    } catch (error) {
      console.error("Error updating item weight:", error);
      throw error;
    }
  };

  // Prepare the context value
  const contextValue: GoalsContextType = {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalStats,
    getGoalsByCategory,
    getActiveGoals,
    getCompletedGoals,
    getFailedGoals,
    archiveGoal,
    unarchiveGoal,
    addItemToGoal,
    removeItemFromGoal,
    updateItemWeight
  };

  return (
    <GoalsContext.Provider value={contextValue}>
      {children}
    </GoalsContext.Provider>
  );
};

// Custom hook to use the goals context
export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}; 