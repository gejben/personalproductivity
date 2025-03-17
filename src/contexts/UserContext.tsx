import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/initialize';

// Copy the FirestoreUser interface from firebase.ts to avoid circular imports
export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: any; // Firestore timestamp
  createdAt: any; // Firestore timestamp
  settings?: {
    theme?: string;
    notifications?: boolean;
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional fields
}

interface UserContextType {
  userData: FirestoreUser | null;
  loading: boolean;
  updateUserData: (data: Partial<FirestoreUser>) => Promise<void>;
  getUserStorageKey: (key: string) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore when auth state changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && currentUser) {
        try {
          setLoading(true);
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserData(userSnap.data() as FirestoreUser);
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, isAuthenticated]);

  // Update user data in Firestore
  const updateUserData = async (data: Partial<FirestoreUser>) => {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  // Get a storage key prefixed with the user ID for localStorage
  const getUserStorageKey = (key: string): string => {
    const prefix = currentUser ? `user_${currentUser.uid}` : 'anonymous';
    return `${prefix}_${key}`;
  };

  return (
    <UserContext.Provider value={{
      userData,
      loading,
      updateUserData,
      getUserStorageKey
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext; 