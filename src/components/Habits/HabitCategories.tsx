import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Paper,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useHabits, HabitCategory } from '../../contexts';
import { ChromePicker } from 'react-color';

interface FormData {
  name: string;
  color: string;
  icon?: string;
}

const HabitCategories: React.FC = () => {
  const { categories, categoriesLoading, addCategory, updateCategory, deleteCategory, getHabitsByCategory } = useHabits();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    color: '#4caf50', // default green
    icon: ''
  });
  
  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      color: '#4caf50',
      icon: ''
    });
    setShowColorPicker(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle color change
  const handleColorChange = (color: any) => {
    setFormData({
      ...formData,
      color: color.hex
    });
  };
  
  // Start editing a category
  const handleEditCategory = (category: HabitCategory) => {
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || ''
    });
    setEditingCategoryId(category.id);
    setShowAddForm(true);
  };
  
  // Handle form submission for adding a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    // Add new category
    await addCategory({
      name: formData.name,
      color: formData.color,
      icon: formData.icon || undefined
    });
    
    // Reset form and hide it
    resetFormData();
    setShowAddForm(false);
  };
  
  // Handle form submission for editing a category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategoryId) return;
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    try {
      // Update category
      await updateCategory(editingCategoryId, {
        name: formData.name,
        color: formData.color,
        icon: formData.icon || undefined
      });
      
      // Reset form and exit edit mode
      resetFormData();
      setEditingCategoryId(null);
      setShowAddForm(false);
    } catch (error) {
      alert(`Error updating category: ${error}`);
    }
  };
  
  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    // Check if category has habits
    const habitsInCategory = getHabitsByCategory(categoryId);
    
    // Confirm deletion if category has habits
    if (habitsInCategory.length > 0) {
      const confirm = window.confirm(
        `This category contains ${habitsInCategory.length} habit(s). Deleting it will remove the category association from these habits. Continue?`
      );
      
      if (!confirm) return;
    }
    
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      alert(`Error deleting category: ${error}`);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    resetFormData();
    setEditingCategoryId(null);
    setShowAddForm(false);
  };
  
  // Render category form
  const renderCategoryForm = () => {
    const isEditing = !!editingCategoryId;
    const title = isEditing ? 'Edit Category' : 'Add New Category';
    const actionButtonText = isEditing ? 'Update' : 'Add';
    const actionHandler = isEditing ? handleUpdateCategory : handleAddCategory;
    
    return (
      <Dialog
        open={showAddForm}
        onClose={handleCancelEdit}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              autoFocus
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Category Color
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mt: 1
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: formData.color,
                    cursor: 'pointer',
                    mr: 2,
                    border: '1px solid #ccc'
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <Typography variant="body2">
                  {formData.color}
                </Typography>
              </Box>
              
              {showColorPicker && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <ChromePicker
                    color={formData.color}
                    onChange={handleColorChange}
                    disableAlpha
                  />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button 
            onClick={actionHandler}
            variant="contained"
            color="primary"
            disabled={!formData.name.trim()}
          >
            {actionButtonText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render categories list
  const renderCategoriesList = () => {
    if (categoriesLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (categories.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No categories created yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{ mt: 1 }}
          >
            Create First Category
          </Button>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {categories.map((category: HabitCategory) => {
          const habitsCount = getHabitsByCategory(category.id).length;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Paper
                sx={{
                  p: 2,
                  position: 'relative',
                  borderLeft: `4px solid ${category.color}`,
                  '&:hover .category-actions': {
                    opacity: 1
                  }
                }}
              >
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" component="h3">
                    {category.name}
                  </Typography>
                  
                  <Box 
                    className="category-actions"
                    sx={{ 
                      display: 'flex', 
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {!category.isDefault && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCategory(category)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCategory(category.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: category.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {category.color}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Chip
                    label={`${habitsCount} habit${habitsCount !== 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  
                  {category.isDefault && (
                    <Chip
                      label="Default"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Habit Categories
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetFormData();
            setShowAddForm(true);
          }}
        >
          Add Category
        </Button>
      </Box>
      
      {renderCategoriesList()}
      {renderCategoryForm()}
    </Box>
  );
};

export default HabitCategories; 