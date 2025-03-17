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
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { db } from '../firebase/initialize';

// Frequency types for habits
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

// Interface for tracking habit completions
export interface HabitCompletion {
  date: string; // ISO string format
  completed: boolean;
}

// Interface for habit categories
export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
}

// Interface for habit object
export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: FrequencyType;
  frequencyValue?: number; // For custom frequency
  frequencyDays?: number[]; // For specifying specific days of the week
  categoryId: string;
  createdAt: Date;
  completions: HabitCompletion[];
  isArchived?: boolean;
  reminderTime?: string;
  color?: string; // Added color property
  // Add any other fields as needed
}

// Interface for habit statistics
export interface HabitStats {
  total: number;
  completed: number;
  streak: number;
  longestStreak: number;
  completionRate: number;
  completedCount?: number; // For backward compatibility
  totalCount?: number; // For backward compatibility
}

// Define context interface
interface HabitsContextType {
  habits: Habit[];
  categories: HabitCategory[];
  loading: boolean;
  categoriesLoading: boolean;
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => Promise<string>;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  addCategory: (categoryData: Omit<HabitCategory, 'id'>) => Promise<string>;
  updateCategory: (id: string, updates: Partial<Omit<HabitCategory, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  completeHabit: (id: string, date: string, completed: boolean) => Promise<void>;
  getHabitsByCategory: (categoryId: string) => Habit[];
  getHabitsForToday: () => Habit[];
  getCompletedHabitsForToday: () => Habit[];
  getRemainingHabitsForToday: () => Habit[];
  getHabitStats: (habit: Habit) => HabitStats;
  getCompletionRate: (habitId: string) => number;
  getStreak: (habit: Habit) => number;
  isHabitCompletedOnDate: (habit: Habit, date: string) => boolean;
  getCategoryById: (categoryId: string) => HabitCategory | undefined;
}

// Create the context
const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

// Provider component
export const HabitsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();

  // Helper function to safely get Firestore instance
  const getFirestore = (): Firestore => {
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    return db;
  };

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

  // Load default categories from Firestore
  useEffect(() => {
    const loadDefaultCategories = async () => {
      if (!db) {
        console.log('Firebase not yet initialized for default categories');
        return [];
      }

      try {
        console.log('Loading default categories from Firestore');
        const firestore = getFirestore();
        const defaultCategoriesRef = collection(firestore, 'defaultCategories');
        const snapshot = await getDocs(defaultCategoriesRef);
        
        const defaultCategories: HabitCategory[] = [];
        snapshot.forEach((doc) => {
          defaultCategories.push({
            id: doc.id,
            ...doc.data() as Omit<HabitCategory, 'id'>,
            isDefault: true
          });
        });
        
        console.log(`Loaded ${defaultCategories.length} default categories`);
        return defaultCategories;
      } catch (error) {
        console.error("Error loading default categories:", error);
        return [];
      }
    };
    
    // Skip if we already have categories (prevents multiple loads)
    if (categories.length === 0 && db) {
      loadDefaultCategories()
        .then(defaultCats => {
          setCategories(defaultCats);
          // Only set loading to false if we have some categories
          if (defaultCats.length > 0) {
            setCategoriesLoading(false);
          }
        });
    }
  }, [categories.length, db]);

  // Load user categories from Firestore
  useEffect(() => {
    if (!currentUser || !db) {
      // If user is not logged in or db is not initialized, load from localStorage
      const savedCategories = localStorage.getItem(getUserStorageKey('habitCategories'));
      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories));
        } catch (e) {
          console.error("Error parsing categories from localStorage:", e);
        }
      }
      setCategoriesLoading(false);
      return;
    }

    try {
      const firestore = getFirestore();
      // Set up Firestore listener for categories
      const categoriesRef = collection(firestore, 'users', currentUser.uid, 'habitCategories');
      
      // Set up real-time listener for categories
      const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
        const userCategories: HabitCategory[] = [];
        snapshot.forEach((doc) => {
          userCategories.push({
            id: doc.id,
            ...doc.data() as Omit<HabitCategory, 'id'>
          });
        });
        
        // Combine with default categories that have isDefault flag
        const defaultCategories = categories.filter(c => c.isDefault);
        
        // Merge, giving priority to user categories if there's a name conflict
        const userCategoryNames = userCategories.map(c => c.name.toLowerCase());
        const filteredDefaults = defaultCategories.filter(
          c => !userCategoryNames.includes(c.name.toLowerCase())
        );
        
        setCategories([...userCategories, ...filteredDefaults]);
        setCategoriesLoading(false);
      }, (error) => {
        console.error("Error loading categories from Firestore:", error);
        setCategoriesLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up categories listener:", error);
      setCategoriesLoading(false);
    }
  }, [currentUser, getUserStorageKey, categories, db]);

  // Load habits from Firestore
  useEffect(() => {
    const fetchHabits = async () => {
      if (!currentUser || !db) {
        setHabits([]);
        setLoading(false);
        return;
      }

      try {
        const firestore = getFirestore();
        // Set up Firestore listener for habits
        const habitsRef = collection(firestore, 'users', currentUser.uid, 'habits');
        
        // Set up real-time listener for habits
        const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
          const userHabits: Habit[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            userHabits.push(convertFirestoreHabitToHabit({
              id: doc.id,
              ...data
            }));
          });
          
          setHabits(userHabits);
          setLoading(false);
        }, (error) => {
          console.error("Error loading habits from Firestore:", error);
          
          // If Firestore fails, fallback to localStorage
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
      } catch (error) {
        console.error("Error setting up habits listener:", error);
        setLoading(false);
        return () => {};
      }
    };
    
    fetchHabits();
  }, [currentUser, db, getUserStorageKey]);

  // Save habits to localStorage as backup
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem(getUserStorageKey('habits'), JSON.stringify(habits));
    }
  }, [habits, getUserStorageKey]);

  // Save categories to localStorage as backup
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(getUserStorageKey('habitCategories'), JSON.stringify(categories));
    }
  }, [categories, getUserStorageKey]);

  // Add a new habit
  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions'>): Promise<string> => {
    if (!currentUser || !db) throw new Error("User not authenticated or Firestore not initialized");

    try {
      const firestore = getFirestore();
      // Create a new document reference with auto-generated ID
      const habitsRef = collection(firestore, 'users', currentUser.uid, 'habits');
      const newHabitRef = doc(habitsRef);
      
      // Prepare the habit data
      const newHabit: Omit<Habit, 'id'> = {
        ...habitData,
        createdAt: new Date(),
        completions: []
      };
      
      // Add to Firestore
      await setDoc(newHabitRef, newHabit);
      
      // Return the new ID (the add will be handled by onSnapshot listener)
      return newHabitRef.id;
    } catch (error) {
      console.error("Error adding habit to Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      const newHabit: Habit = {
        id: Date.now().toString(),
        ...habitData,
        createdAt: new Date(),
        completions: []
      };
      
      setHabits([...habits, newHabit]);
      return newHabit.id;
    }
  };

  // Update an existing habit
  const updateHabit = async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<void> => {
    if (!currentUser || !db) return;

    try {
      // Update in Firestore
      const firestore = getFirestore();
      const habitRef = doc(firestore, 'users', currentUser.uid, 'habits', id);
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
    if (!currentUser || !db) return;

    try {
      // Delete from Firestore
      const firestore = getFirestore();
      const habitRef = doc(firestore, 'users', currentUser.uid, 'habits', id);
      await deleteDoc(habitRef);

      // Delete will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error deleting habit from Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setHabits(habits.filter((habit) => habit.id !== id));
    }
  };

  // Add a new category
  const addCategory = async (categoryData: Omit<HabitCategory, 'id'>): Promise<string> => {
    if (!currentUser || !db) throw new Error("User not authenticated or Firestore not initialized");

    try {
      // Create a new document reference with auto-generated ID
      const firestore = getFirestore();
      const categoriesRef = collection(firestore, 'users', currentUser.uid, 'habitCategories');
      const newCategoryRef = doc(categoriesRef);
      
      // Add to Firestore
      await setDoc(newCategoryRef, categoryData);
      
      // Return the new ID (the add will be handled by onSnapshot listener)
      return newCategoryRef.id;
    } catch (error) {
      console.error("Error adding category to Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      const newCategory: HabitCategory = {
        id: Date.now().toString(),
        ...categoryData
      };
      
      setCategories([...categories, newCategory]);
      return newCategory.id;
    }
  };

  // Update an existing category
  const updateCategory = async (id: string, updates: Partial<Omit<HabitCategory, 'id'>>): Promise<void> => {
    if (!currentUser || !db) return;

    // Check if it's a default category (which can't be modified)
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      throw new Error("Default categories cannot be modified");
    }

    try {
      // Update in Firestore
      const firestore = getFirestore();
      const categoryRef = doc(firestore, 'users', currentUser.uid, 'habitCategories', id);
      await updateDoc(categoryRef, updates);
      
      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error updating category in Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setCategories(
        categories.map((category) => 
          category.id === id ? { ...category, ...updates } : category
        )
      );
    }
  };

  // Delete a category
  const deleteCategory = async (id: string): Promise<void> => {
    if (!currentUser || !db) return;

    // Check if it's a default category (which can't be deleted)
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      throw new Error("Default categories cannot be deleted");
    }

    // Check if there are habits using this category
    const habitsUsingCategory = habits.filter(h => h.categoryId === id);
    if (habitsUsingCategory.length > 0) {
      throw new Error("Cannot delete category that has habits assigned to it");
    }

    try {
      // Delete from Firestore
      const firestore = getFirestore();
      const categoryRef = doc(firestore, 'users', currentUser.uid, 'habitCategories', id);
      await deleteDoc(categoryRef);
      
      // Delete will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error deleting category from Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setCategories(categories.filter((category) => category.id !== id));
    }
  };

  // Mark a habit as completed for a specific date
  const completeHabit = async (id: string, date: string, completed: boolean): Promise<void> => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    // Find if there's an existing completion for this date
    const existingCompletionIndex = habit.completions.findIndex(c => c.date === date);
    let updatedCompletions = [...habit.completions];

    if (existingCompletionIndex >= 0) {
      // Update existing completion
      updatedCompletions[existingCompletionIndex] = { 
        date, 
        completed 
      };
    } else {
      // Add new completion
      updatedCompletions.push({ 
        date, 
        completed 
      });
    }

    // Update the habit with new completion data
    await updateHabit(id, { completions: updatedCompletions });
  };

  // Get habits by category ID
  const getHabitsByCategory = (categoryId: string): Habit[] => {
    return habits
      .filter(habit => !habit.isArchived && habit.categoryId === categoryId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Check if a habit should be completed today based on its frequency
  const isHabitDueToday = (habit: Habit): boolean => {
    const today = new Date();
    
    switch (habit.frequency) {
      case 'daily':
        return true;
      
      case 'weekly':
        // Check if today is the same day of the week as when the habit was created
        return today.getDay() === habit.createdAt.getDay();
      
      case 'monthly':
        // Check if today is the same day of the month as when the habit was created
        return today.getDate() === habit.createdAt.getDate();
      
      case 'custom':
        if (!habit.frequencyValue) return false;
        
        // Calculate days since creation
        const daysSinceCreation = Math.floor((today.getTime() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if today is a day when the habit should be completed based on the custom frequency
        return daysSinceCreation % habit.frequencyValue === 0;
      
      default:
        return false;
    }
  };

  // Get habits due for today
  const getHabitsForToday = (): Habit[] => {
    return habits
      .filter(habit => !habit.isArchived && isHabitDueToday(habit))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get completed habits for today
  const getCompletedHabitsForToday = (): Habit[] => {
    const today = new Date().toISOString().split('T')[0];
    return getHabitsForToday().filter(habit => 
      isHabitCompletedOnDate(habit, today)
    );
  };

  // Get remaining habits for today
  const getRemainingHabitsForToday = (): Habit[] => {
    const today = new Date().toISOString().split('T')[0];
    return getHabitsForToday().filter(habit => 
      !isHabitCompletedOnDate(habit, today)
    );
  };

  // Check if a habit is completed on a specific date
  const isHabitCompletedOnDate = (habit: Habit, date: string): boolean => {
    return habit.completions.some(completion => 
      completion.date === date && completion.completed
    );
  };

  // Calculate completion rate for a habit
  const getCompletionRate = (habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    
    return getHabitStats(habit).completionRate;
  };

  // Calculate current streak for a habit
  const getStreak = (habit: Habit): number => {
    return getHabitStats(habit).streak;
  };

  // Calculate statistics for a habit
  const getHabitStats = (habit: Habit): HabitStats => {
    // Default stats
    const stats: HabitStats = {
      total: 0,
      completed: 0,
      streak: 0,
      longestStreak: 0,
      completionRate: 0
    };
    
    // If no habit or no completions, return default stats
    if (!habit || !habit.completions.length) return stats;
    
    // Sort completions by date
    const sortedCompletions = [...habit.completions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate total days the habit has been tracked
    const firstCompletionDate = new Date(sortedCompletions[0].date);
    const today = new Date();
    const dayDiff = Math.floor((today.getTime() - firstCompletionDate.getTime()) / (1000 * 60 * 60 * 24));
    stats.total = dayDiff + 1; // +1 to include today
    
    // Count completed days
    stats.completed = sortedCompletions.filter(c => c.completed).length;
    
    // Calculate completion rate
    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    // Calculate current streak and longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Go through completions from most recent to oldest
    const reversedCompletions = [...sortedCompletions].reverse();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if we need to add today's completion status if it's not already in the list
    if (!reversedCompletions.some(c => c.date === todayStr)) {
      reversedCompletions.unshift({
        date: todayStr,
        completed: isHabitCompletedOnDate(habit, todayStr)
      });
    }
    
    // Calculate streaks
    for (let i = 0; i < reversedCompletions.length; i++) {
      const completion = reversedCompletions[i];
      
      if (completion.completed) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Streak broken
        currentStreak = 0;
      }
      
      // If we're not looking at today or yesterday, check for missing days
      if (i > 0 && i < reversedCompletions.length - 1) {
        const currentDate = new Date(completion.date);
        const nextDate = new Date(reversedCompletions[i + 1].date);
        
        // If there's a gap of more than 1 day, streak is broken
        const dayGap = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayGap > 1) {
          currentStreak = 0;
        }
      }
    }
    
    stats.streak = currentStreak;
    stats.longestStreak = longestStreak;
    
    return stats;
  };

  // Get category by ID
  const getCategoryById = (categoryId: string): HabitCategory | undefined => {
    return categories.find(category => category.id === categoryId);
  };

  // Prepare the context value
  const contextValue: HabitsContextType = {
    habits,
    categories,
    loading,
    categoriesLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    addCategory,
    updateCategory,
    deleteCategory,
    completeHabit,
    getHabitsByCategory,
    getHabitsForToday,
    getCompletedHabitsForToday,
    getRemainingHabitsForToday,
    getHabitStats,
    getCompletionRate,
    getStreak,
    isHabitCompletedOnDate,
    getCategoryById
  };

  return (
    <HabitsContext.Provider value={contextValue}>
      {children}
    </HabitsContext.Provider>
  );
};

// Custom hook to use the habits context
export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};

export default HabitsContext; 