import React, { useState } from 'react';
import { useTodo } from '../../contexts/TodoContext';
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
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface TodoProps {
  compact?: boolean;
}

const Todo: React.FC<TodoProps> = ({ compact = false }) => {
  const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodo();
  const [inputValue, setInputValue] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddTodo = () => {
    if (inputValue.trim()) {
      addTodo(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Card>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Todo List
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size={compact ? "small" : "medium"}
            fullWidth
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleAddTodo}
            size={compact ? "small" : "medium"}
          >
            <AddIcon />
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Paper 
          elevation={0} 
          sx={{ 
            maxHeight: isMobile ? 'calc(100vh - 300px)' : 400, 
            overflow: 'auto' 
          }}
        >
          <List dense={compact}>
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
                      onClick={() => deleteTodo(todo.id)}
                      size={compact ? "small" : "medium"}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton role={undefined} onClick={() => toggleTodo(todo.id)} dense>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={todo.completed}
                        tabIndex={-1}
                        disableRipple
                        size={compact ? "small" : "medium"}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={todo.title}
                      secondary={compact ? null : formatDate(todo.createdAt)}
                      primaryTypographyProps={{
                        style: {
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? '#888' : 'inherit',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }
                      }}
                      secondaryTypographyProps={{
                        style: {
                          fontSize: isMobile ? '0.7rem' : '0.8rem'
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default Todo; 