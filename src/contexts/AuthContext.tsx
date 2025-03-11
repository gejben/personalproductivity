import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { onAuthStateChange, signInWithGoogle, signOut, getCurrentUser } from '../firebase/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  logOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (): Promise<User | null> => {
    try {
      const user = await signInWithGoogle();
      return user;
    } catch (error) {
      console.error('Error during sign in:', error);
      return null;
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    logOut,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 