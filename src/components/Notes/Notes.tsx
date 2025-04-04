import React, { useState, useEffect } from 'react';
import { useNotes, Note } from '../../contexts/NotesContext';
import './Notes.css';
import { useTheme } from '@mui/material/styles';
import { Box, TextField, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

interface NotesProps {
  compact?: boolean;
}

const Notes: React.FC<NotesProps> = ({ compact = false }) => {
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
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [newNote, setNewNote] = useState('');
  const theme = useTheme();

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      // On mobile, if we have notes, start with the editor view
      if (window.innerWidth <= 768 && notes.length > 0 && !activeNote) {
        setShowSidebar(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [notes, activeNote]);

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
  }, [notes, activeNote]);

  // When a new note is created, select it
  useEffect(() => {
    if (notes.length > 0 && !activeNote) {
      // Find the most recently created note (should be at the beginning of the array)
      const mostRecentNote = [...notes].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt).getTime() - 
        new Date(a.updatedAt || a.createdAt).getTime()
      )[0];
      
      if (mostRecentNote) {
        setActiveNote(mostRecentNote);
        setTitle(mostRecentNote.title);
        setContent(mostRecentNote.content);
        
        // On mobile, switch to editor view
        if (isMobile) {
          setShowSidebar(false);
        }
      }
    }
  }, [notes.length, activeNote, isMobile]);

  const handleNoteSelect = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    
    // On mobile, switch to editor view after selecting a note
    if (isMobile) {
      setShowSidebar(false);
    }
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

  const handleAddNote = async () => {
    if (newNote.trim()) {
      const note = await createNote();
      if (note?.id) {
        await updateNoteContent(note.id, newNote.trim());
      }
      setNewNote('');
    }
  };

  const handleDeleteNote = (id: string) => {
    if (activeNote && activeNote.id === id) {
      setActiveNote(null);
      setTitle('');
      setContent('');
    }
    deleteNote(id);
  };

  const toggleView = () => {
    setShowSidebar(!showSidebar);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="notes-container">
      {isMobile && (
        <div className="mobile-note-controls">
          <button onClick={toggleView}>
            {showSidebar ? 'View Editor' : 'View Notes List'}
          </button>
          {!showSidebar && activeNote && (
            <span>{activeNote.title || 'Untitled Note'}</span>
          )}
          <button onClick={handleAddNote}>New Note</button>
        </div>
      )}
      
      {(!isMobile || showSidebar) && (
        <div className="notes-sidebar">
          {!isMobile && (
            <div className="notes-header">
              <h2>Notes</h2>
              <button onClick={handleAddNote}>New Note</button>
            </div>
          )}
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
                  <div className="note-title">{note.title || 'Untitled Note'}</div>
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
      )}
      
      {(!isMobile || !showSidebar) && (
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
      )}

      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size={compact ? "small" : "medium"}
            fullWidth
            multiline
            maxRows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write a note..."
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleAddNote}
            size={compact ? "small" : "medium"}
          >
            <AddIcon />
          </Button>
        </Box>

        <List dense={compact}>
          {notes.map((note) => (
            <ListItem
              key={note.id}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={() => deleteNote(note.id)}
                  size={compact ? "small" : "medium"}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={note.content}
                secondary={compact ? null : new Date(note.createdAt).toLocaleDateString()}
                primaryTypographyProps={{
                  style: {
                    whiteSpace: 'pre-wrap',
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </div>
  );
};

export default Notes; 