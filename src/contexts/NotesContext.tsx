import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface NotesContextType {
  notes: Note[];
  activeNote: Note | null;
  setActiveNote: (note: Note | null) => void;
  createNote: () => void;
  updateNoteTitle: (id: number, title: string) => void;
  updateNoteContent: (id: number, content: string) => void;
  deleteNote: (id: number) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const { getUserStorageKey } = useUser();

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(getUserStorageKey('notes'));
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      // Convert string dates back to Date objects
      const notesWithDates = parsedNotes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
      }));
      setNotes(notesWithDates);
    }
  }, [getUserStorageKey]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(getUserStorageKey('notes'), JSON.stringify(notes));
  }, [notes, getUserStorageKey]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      createdAt: new Date(),
    };
    setNotes([...notes, newNote]);
    setActiveNote(newNote);
  };

  const updateNoteTitle = (id: number, title: string) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, title } : note
    );
    setNotes(updatedNotes);
    
    if (activeNote && activeNote.id === id) {
      setActiveNote({ ...activeNote, title });
    }
  };

  const updateNoteContent = (id: number, content: string) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, content } : note
    );
    setNotes(updatedNotes);
    
    if (activeNote && activeNote.id === id) {
      setActiveNote({ ...activeNote, content });
    }
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
    if (activeNote && activeNote.id === id) {
      setActiveNote(null);
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        activeNote,
        setActiveNote,
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