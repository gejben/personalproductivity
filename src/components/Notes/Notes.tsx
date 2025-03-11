import React, { useState, useEffect } from 'react';
import { useNotes, Note } from '../../contexts/NotesContext';
import './Notes.css';

const Notes: React.FC = () => {
  const { 
    notes, 
    loading,
    createNote, 
    updateNoteTitle, 
    updateNoteContent, 
    deleteNote 
  } = useNotes();
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Update local state when active note changes
  useEffect(() => {
    if (activeNote) {
      // Find the updated note from the notes array
      const updatedNote = notes.find(note => note.id === activeNote.id);
      if (updatedNote) {
        setActiveNote(updatedNote);
        setTitle(updatedNote.title);
        setContent(updatedNote.content);
      } else {
        // If the active note was deleted
        setActiveNote(null);
        setTitle('');
        setContent('');
      }
    }
  }, [notes]);

  const handleNoteSelect = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (activeNote) {
      updateNoteTitle(activeNote.id, newTitle);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (activeNote) {
      updateNoteContent(activeNote.id, newContent);
    }
  };

  const handleCreateNote = () => {
    createNote();
    // The new note will be added to the notes array via the Firestore listener
    // We'll select it in the next render cycle
  };

  const handleDeleteNote = (id: string) => {
    if (activeNote && activeNote.id === id) {
      setActiveNote(null);
      setTitle('');
      setContent('');
    }
    deleteNote(id);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="notes-container">
      <div className="notes-sidebar">
        <div className="notes-header">
          <h2>Notes</h2>
          <button onClick={handleCreateNote}>New Note</button>
        </div>
        <div className="notes-list">
          {loading ? (
            <div className="loading">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="no-notes">No notes yet</div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${
                  activeNote && activeNote.id === note.id ? 'active' : ''
                }`}
                onClick={() => handleNoteSelect(note)}
              >
                <div className="note-title">{note.title}</div>
                <div className="note-meta">
                  <span className="note-date">{formatDate(note.updatedAt || note.createdAt)}</span>
                  <button
                    className="note-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="notes-editor">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeNote ? (
          <>
            <input
              type="text"
              className="note-title-input"
              value={title}
              onChange={handleTitleChange}
              placeholder="Note Title"
            />
            <textarea
              className="note-content-input"
              value={content}
              onChange={handleContentChange}
              placeholder="Write your note here..."
            />
          </>
        ) : (
          <div className="no-note-selected">
            <p>Select a note or create a new one to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes; 