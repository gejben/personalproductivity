import React, { useState, useEffect } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import './Notes.css';

const Notes: React.FC = () => {
  const { 
    notes, 
    activeNote, 
    setActiveNote, 
    createNote, 
    updateNoteTitle, 
    updateNoteContent, 
    deleteNote 
  } = useNotes();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Update local state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNote]);

  const handleNoteSelect = (note: any) => {
    setActiveNote(note);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (activeNote) {
      updateNoteTitle(activeNote.id, e.target.value);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (activeNote) {
      updateNoteContent(activeNote.id, e.target.value);
    }
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
          <button onClick={createNote}>New Note</button>
        </div>
        <div className="notes-list">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`note-item ${
                activeNote && activeNote.id === note.id ? 'active' : ''
              }`}
              onClick={() => handleNoteSelect(note)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-meta">
                <span className="note-date">{formatDate(note.createdAt)}</span>
                <button
                  className="note-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="notes-editor">
        {activeNote ? (
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