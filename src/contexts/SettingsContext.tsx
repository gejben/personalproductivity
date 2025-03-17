import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/initialize';
import { useUser } from './UserContext';

interface Settings {
  darkMode: boolean;
  notifications: boolean;
  autoStartPomodoro: boolean;
  defaultPomodoroTime: number;
  defaultShortBreakTime: number;
  defaultLongBreakTime: number;
  [key: string]: any; // Allow for dynamic settings
}

const defaultSettings: Settings = {
  darkMode: false,
  notifications: true,
  autoStartPomodoro: false,
  defaultPomodoroTime: 25,
  defaultShortBreakTime: 5,
  defaultLongBreakTime: 15,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  isAdmin: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();

  // List of admin emails
  const adminEmails = ['your-admin-email@example.com']; // Add your admin emails here

  // Check if user is an admin
  useEffect(() => {
    if (currentUser && adminEmails.includes(currentUser.email || '')) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) {
        // Use default settings when not logged in
        setSettings(defaultSettings);
        return;
      }

      try {
        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'userSettings');
        const settingsDoc = await getDoc(settingsDocRef);

        if (settingsDoc.exists()) {
          const loadedSettings = settingsDoc.data() as Settings;
          setSettings({ ...defaultSettings, ...loadedSettings });
        } else {
          // Create default settings document
          await setDoc(settingsDocRef, {
            ...defaultSettings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error loading settings from Firestore:", error);
        
        // Fall back to localStorage if available
        const savedSettings = localStorage.getItem(getUserStorageKey('settings'));
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            setSettings({ ...defaultSettings, ...parsedSettings });
          } catch (e) {
            console.error("Error parsing settings from localStorage:", e);
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
      }
    };

    loadSettings();
  }, [currentUser, getUserStorageKey]);

  // Save settings to localStorage as a backup
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      localStorage.setItem(getUserStorageKey('settings'), JSON.stringify(settings));
    }
  }, [settings, getUserStorageKey]);

  // Update settings
  const updateSettings = async (updates: Partial<Settings>): Promise<void> => {
    // Update local state
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (!currentUser) return;

    try {
      // Update in Firestore
      const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'userSettings');
      await updateDoc(settingsDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating settings in Firestore:", error);
      // We already updated the local state, so the user will see their changes
      // even if the Firestore update fails
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isAdmin,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext; 