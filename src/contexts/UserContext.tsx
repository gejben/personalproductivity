import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserFromFirestore, 
  updateUserInFirestore, 
  FirestoreUser 
} from '../firebase/firebase';

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
          const firestoreUser = await getUserFromFirestore(currentUser.uid);
          setUserData(firestoreUser);
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
      await updateUserInFirestore(currentUser.uid, data);
      
      // Update local state
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  // Helper function to get user-specific storage keys (for backward compatibility)
  const getUserStorageKey = (key: string): string => {
    if (!currentUser) {
      return key;
    }
    return `${key}_${currentUser.uid}`;
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        updateUserData,
        getUserStorageKey,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext; 