import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  initialized: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
  initialized: false
});

export const useFirebase = () => useContext(FirebaseContext);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [firebaseInstance, setFirebaseInstance] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    db: null,
    initialized: false
  });

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log('Initializing Firebase...');
        
        // Check if Firebase is already initialized
        let app;
        if (getApps().length === 0) {
          app = initializeApp(firebaseConfig);
          console.log('Firebase app initialized');
        } else {
          app = getApps()[0];
          console.log('Using existing Firebase app');
        }
        
        // Initialize Firebase services
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        setFirebaseInstance({
          app,
          auth,
          db,
          initialized: true
        });
        
        console.log('Firebase initialization complete');
      } catch (error) {
        console.error('Firebase initialization error:', error);
      }
    };

    initializeFirebase();
  }, []);

  return (
    <FirebaseContext.Provider value={firebaseInstance}>
      {firebaseInstance.initialized ? children : <div>Loading Firebase...</div>}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider; 