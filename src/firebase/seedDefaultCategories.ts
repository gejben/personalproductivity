/**
 * Seed script for adding default habit categories to Firestore
 * Run this script once to populate the defaultCategories collection
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// Define the HabitCategory interface directly in this file to avoid JSX import issues
interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
}

// Ensure Firebase is initialized
let firestore = db;

// This function ensures Firestore is initialized
const ensureFirestoreInitialized = () => {
  if (!firestore) {
    try {
      console.log('Initializing Firebase...');
      const app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new Error('Firebase initialization failed');
    }
  }
  return firestore;
};

const defaultCategories: Omit<HabitCategory, 'id'>[] = [
  {
    name: 'Health',
    color: '#e74c3c',
    icon: 'favorite', // Material UI icon name
    isDefault: true
  },
  {
    name: 'Fitness',
    color: '#2ecc71',
    icon: 'fitness_center',
    isDefault: true
  },
  {
    name: 'Learning',
    color: '#3498db',
    icon: 'school',
    isDefault: true
  },
  {
    name: 'Productivity',
    color: '#f39c12',
    icon: 'work',
    isDefault: true
  },
  {
    name: 'Mindfulness',
    color: '#9b59b6',
    icon: 'self_improvement',
    isDefault: true
  },
  {
    name: 'Finance',
    color: '#1abc9c',
    icon: 'savings',
    isDefault: true
  },
  {
    name: 'Social',
    color: '#e67e22',
    icon: 'people',
    isDefault: true
  }
];

/**
 * Seeds the default categories to Firestore
 */
export const seedDefaultCategories = async () => {
  try {
    console.log('Starting to seed default categories...');
    
    // Ensure Firestore is initialized
    const db = ensureFirestoreInitialized();
    console.log('Firestore DB object:', db ? 'Valid' : 'Invalid');
    
    // Check if collection already has items
    const snapshot = await getDocs(collection(db, 'defaultCategories'));
    
    if (!snapshot.empty) {
      console.log('Default categories already exist. Skipping seeding.');
      return;
    }
    
    // Add default categories to Firestore
    const categoriesRef = collection(db, 'defaultCategories');
    
    for (const category of defaultCategories) {
      const newDocRef = doc(categoriesRef);
      await setDoc(newDocRef, {
        ...category,
        id: newDocRef.id
      });
      console.log(`Added category: ${category.name}`);
    }
    
    console.log('Successfully seeded default categories');
  } catch (error) {
    console.error('Error seeding default categories:', error);
    throw error;
  }
};

/**
 * Resets (deletes and recreates) the default categories in Firestore
 * Use with caution - this will delete all existing default categories
 */
export const resetDefaultCategories = async () => {
  try {
    console.log('Resetting default categories...');
    
    // Ensure Firestore is initialized
    const db = ensureFirestoreInitialized();
    
    // Delete all existing categories
    const snapshot = await getDocs(collection(db, 'defaultCategories'));
    
    const deletePromises: Promise<void>[] = [];
    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(docSnapshot.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('Deleted existing default categories');
    
    // Add default categories again
    const categoriesRef = collection(db, 'defaultCategories');
    
    for (const category of defaultCategories) {
      const newDocRef = doc(categoriesRef);
      await setDoc(newDocRef, {
        ...category,
        id: newDocRef.id
      });
      console.log(`Added category: ${category.name}`);
    }
    
    console.log('Successfully reset default categories');
  } catch (error) {
    console.error('Error resetting default categories:', error);
    throw error;
  }
}; 