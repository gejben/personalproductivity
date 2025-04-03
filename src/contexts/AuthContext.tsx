import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/initialize';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  logOut: () => Promise<void>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth listener
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (): Promise<User | null> => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error during sign in:', error);
      return null;
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    logOut,
    isAuthenticated: !!currentUser,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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