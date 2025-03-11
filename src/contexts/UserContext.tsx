import React, { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
}

interface UserContextType {
  getUserStorageKey: (key: string) => string;
}

// Create a fixed user
const FIXED_USER: User = {
  id: 'gejben-user-id',
  name: 'gejben'
};

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Helper function to get user-specific storage keys
  const getUserStorageKey = (key: string): string => {
    return `${key}_${FIXED_USER.id}`;
  };

  return (
    <UserContext.Provider
      value={{
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