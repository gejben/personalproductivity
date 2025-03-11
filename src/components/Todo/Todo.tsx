import React, { useState } from 'react';
import { useTodo, TodoItem } from '../../contexts/TodoContext';
import {
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Box,
  Divider,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const Todo: React.FC = () => {
  const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodo();
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddTodo = () => {
    if (inputValue.trim() !== '') {
      addTodo(inputValue);
      setInputValue('');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Todo List
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Add a new task..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            disabled={loading}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddTodo}
            startIcon={<AddIcon />}
            disabled={loading}
          >
            Add
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Paper elevation={0} sx={{ maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List>
              {todos.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No tasks yet" 
                    secondary="Add a task to get started" 
                    sx={{ textAlign: 'center', color: 'text.secondary' }}
                  />
                </ListItem>
              ) : (
                todos.map((todo) => (
                  <ListItem
                    key={todo.id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => deleteTodo(todo.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={() => toggleTodo(todo.id)} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={todo.completed}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={todo.text}
                        secondary={formatDate(todo.createdAt)}
                        sx={{
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? 'text.secondary' : 'text.primary'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </Paper>
      </CardContent>
    </Card>
  );
};

export default Todo; 