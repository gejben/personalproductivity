import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  createNote: () => void;
  updateNoteTitle: (id: string, title: string) => void;
  updateNoteContent: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { getUserStorageKey } = useUser();

  // Convert Firestore data to Note
  const convertFirestoreNoteToNote = (data: any): Note => {
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : new Date(data.updatedAt || data.createdAt)
    };
  };

  // Load notes from Firestore when user changes
  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a reference to the user's notes collection
    const notesRef = collection(db, 'users', currentUser.uid, 'notes');
    
    // Create a query to order notes by update date
    const notesQuery = query(notesRef, orderBy('updatedAt', 'desc'));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        const noteData = doc.data();
        notesData.push(convertFirestoreNoteToNote({
          id: doc.id,
          ...noteData
        }));
      });
      setNotes(notesData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading notes from Firestore:", error);
      
      // Fallback to localStorage if Firestore fails
      const savedNotes = localStorage.getItem(getUserStorageKey('notes'));
      if (savedNotes) {
        try {
          const parsedNotes = JSON.parse(savedNotes);
          // Add createdAt and updatedAt if they don't exist
          const notesWithDates = parsedNotes.map((note: any) => ({
            ...note,
            createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
            updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date()
          }));
          setNotes(notesWithDates);
        } catch (e) {
          console.error("Error parsing notes from localStorage:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, getUserStorageKey]);

  // Save notes to localStorage as backup
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(getUserStorageKey('notes'), JSON.stringify(notes));
    }
  }, [notes, getUserStorageKey]);

  const createNote = async () => {
    if (!currentUser) return;

    try {
      // Create a new document reference with auto-generated ID
      const notesRef = collection(db, 'users', currentUser.uid, 'notes');
      const newNoteRef = doc(notesRef);
      
      const now = new Date();
      const newNote: Note = {
        id: newNoteRef.id,
        title: 'New Note',
        content: '',
        createdAt: now,
        updatedAt: now
      };

      // Save to Firestore
      await setDoc(newNoteRef, {
        ...newNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error adding note to Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      const newNote: Note = {
        id: Date.now().toString(),
        title: 'New Note',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setNotes([newNote, ...notes]);
    }
  };

  const updateNoteTitle = async (id: string, title: string) => {
    if (!currentUser) return;

    try {
      // Update in Firestore
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await updateDoc(noteRef, {
        title,
        updatedAt: serverTimestamp()
      });

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error updating note title in Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setNotes(
        notes.map((note) =>
          note.id === id ? { 
            ...note, 
            title,
            updatedAt: new Date()
          } : note
        )
      );
    }
  };

  const updateNoteContent = async (id: string, content: string) => {
    if (!currentUser) return;

    try {
      // Update in Firestore
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await updateDoc(noteRef, {
        content,
        updatedAt: serverTimestamp()
      });

      // Update will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error updating note content in Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setNotes(
        notes.map((note) =>
          note.id === id ? { 
            ...note, 
            content,
            updatedAt: new Date()
          } : note
        )
      );
    }
  };

  const deleteNote = async (id: string) => {
    if (!currentUser) return;

    try {
      // Delete from Firestore
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await deleteDoc(noteRef);

      // Delete will be handled by onSnapshot listener
    } catch (error) {
      console.error("Error deleting note from Firestore:", error);
      
      // Fallback to local state only if Firestore fails
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        createNote,
        updateNoteTitle,
        updateNoteContent,
        deleteNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export default NotesContext; 