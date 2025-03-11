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

const Todo: React.FC = () => {
  const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodo();
  const [inputValue, setInputValue] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Todo List
        </Typography>
        
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 1,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
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
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              mt: isMobile ? 1 : 0
            }}
          >
            Add
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
                        sx={{ ml: isMobile ? 1 : 2 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    disablePadding
                    sx={{ mb: isMobile ? 1 : 0 }}
                  >
                    <ListItemButton 
                      onClick={() => toggleTodo(todo.id)} 
                      dense
                      sx={{ 
                        pr: isMobile ? 6 : 8,
                        py: isMobile ? 1 : 'auto'
                      }}
                    >
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
          )}
        </Paper>
      </CardContent>
    </Card>
  );
};

export default Todo; 