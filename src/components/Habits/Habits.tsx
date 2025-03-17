import React, { useState } from 'react';
import { useHabits, Habit, FrequencyType, HabitStats } from '../../contexts';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Grid,
  Divider,
  IconButton,
  Chip,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Stack,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import HabitCategories from './HabitCategories';

const Habits: React.FC = () => {
  const {
    habits,
    categories,
    loading,
    categoriesLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    getHabitStats,
    getHabitsForToday,
    getCompletedHabitsForToday,
    getRemainingHabitsForToday,
    isHabitCompletedOnDate,
    getHabitsByCategory,
    getCategoryById,
  } = useHabits();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  // Form state for adding/editing habits
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    frequency: FrequencyType;
    frequencyValue: number;
    frequencyDays: number[];
    color: string;
    categoryId: string;
  }>({
    name: '',
    description: '',
    frequency: 'daily',
    frequencyValue: 1,
    frequencyDays: [],
    color: '#3f51b5',
    categoryId: '',
  });

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      frequencyValue: 1,
      frequencyDays: [],
      color: '#3f51b5',
      categoryId: '',
    });
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle frequency days selection (for weekly/custom frequency)
  const handleDayToggle = (day: number) => {
    const currentDays = [...formData.frequencyDays];
    const index = currentDays.indexOf(day);

    if (index === -1) {
      // Add day
      currentDays.push(day);
    } else {
      // Remove day
      currentDays.splice(index, 1);
    }

    setFormData({
      ...formData,
      frequencyDays: currentDays,
    });
  };

  // Handle form submission for adding a habit
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create the habit object
      await addHabit({
        name: formData.name,
        description: formData.description,
        frequency: formData.frequency,
        frequencyValue: formData.frequencyValue,
        categoryId: formData.categoryId || categories[0]?.id || '',
      });

      // Reset form and hide it
      resetFormData();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding habit:', error);
      alert('Error adding habit');
    }
  };

  // Handle form submission for editing a habit
  const handleEditHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingHabitId) return;

    try {
      // Update the habit
      await updateHabit(editingHabitId, {
        name: formData.name,
        description: formData.description || '',
        frequency: formData.frequency,
        frequencyValue: formData.frequencyValue,
        categoryId: formData.categoryId,
      });

      // Reset form and exit edit mode
      resetFormData();
      setEditingHabitId(null);
    } catch (error) {
      console.error('Error updating habit:', error);
      alert('Error updating habit');
    }
  };

  // Edit a habit (populate form with habit data)
  const handleEditClick = (habit: Habit) => {
    setFormData({
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
      frequencyValue: habit.frequencyValue || 1,
      frequencyDays: [],
      color: getCategoryById(habit.categoryId)?.color || '#3f51b5',
      categoryId: habit.categoryId,
    });
    setEditingHabitId(habit.id);
  };

  // Format frequency text
  const formatFrequency = (habit: Habit): string => {
    switch (habit.frequency) {
      case 'daily':
        return habit.frequencyValue === 1
          ? 'Daily'
          : `${habit.frequencyValue} times a day`;
      case 'weekly':
        return habit.frequencyValue === 1
          ? 'Weekly'
          : `${habit.frequencyValue} times a week`;
      case 'monthly':
        return habit.frequencyValue === 1
          ? 'Monthly'
          : `${habit.frequencyValue} times a month`;
      case 'custom':
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const habitDays = habit.frequencyDays || [];
        return habitDays.length > 0
          ? `On: ${habitDays.map((d: number) => days[d]).join(', ')}`
          : 'Custom';
      default:
        return '';
    }
  };

  // Get day names for frequency selection
  const getDayNames = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  };

  // Toggle between all habits and categorized view
  const toggleCategoriesView = () => {
    setShowCategories(!showCategories);
    if (showCategories) {
      setSelectedCategoryId(null);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  // Get habits filtered by category and/or day
  const getFilteredHabits = (): Habit[] => {
    if (selectedCategoryId !== null) {
      // Filter by selected category
      const categoryHabits = getHabitsByCategory(selectedCategoryId);
      return showAllHabits ? categoryHabits : categoryHabits.filter(h => shouldDoHabitOnDate(h, new Date()));
    }
    
    // No category filter
    return showAllHabits ? habits : getHabitsForToday();
  };

  // Utility function to check if a habit should be done on a date
  const shouldDoHabitOnDate = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0-6, 0 is Sunday
    
    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        // If frequencyDays is specified, check if today is one of those days
        const weeklyDays = habit.frequencyDays || [];
        if (weeklyDays.length > 0) {
          return weeklyDays.includes(dayOfWeek);
        }
        // Otherwise, assume it can be done any day of the week
        return true;
      case 'monthly':
        // For monthly, we'll assume it can be done any day of the month
        return true;
      case 'custom':
        // For custom, check if today is one of the specified days
        const customDays = habit.frequencyDays || [];
        return customDays.includes(dayOfWeek) || false;
      default:
        return true;
    }
  };

  // Get human-readable frequency text
  const getFrequencyText = (habit: Habit): string => {
    switch (habit.frequency) {
      case 'daily':
        return habit.frequencyValue === 1
          ? 'Once a day'
          : `${habit.frequencyValue} times a day`;
      case 'weekly':
        return habit.frequencyValue === 1
          ? 'Once a week'
          : `${habit.frequencyValue} times a week`;
      case 'monthly':
        return habit.frequencyValue === 1
          ? 'Once a month'
          : `${habit.frequencyValue} times a month`;
      case 'custom':
        // We need to adapt this for the new structure
        return 'Custom schedule';
      default:
        return 'Unknown frequency';
    }
  };

  // Render habit form (add/edit)
  const renderHabitForm = () => {
    const isEditing = !!editingHabitId;
    
    return (
      <Dialog 
        open={showAddForm || !!editingHabitId} 
        onClose={() => {
          resetFormData();
          setEditingHabitId(null);
          setShowAddForm(false);
        }}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isEditing ? 'Edit Habit' : 'Add New Habit'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Habit Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              autoFocus
            />
            
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={2}
              id="description"
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleSelectChange}
                label="Category"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          bgcolor: category.color,
                          mr: 1 
                        }} 
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="frequency-type-label">Frequency</InputLabel>
              <Select
                labelId="frequency-type-label"
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleSelectChange}
                label="Frequency"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            
            {formData.frequency === 'custom' && (
              <FormControl fullWidth margin="normal">
                <Typography variant="subtitle2" gutterBottom>
                  Days of the Week
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getDayNames().map((day, index) => (
                    <Chip
                      key={index}
                      label={day}
                      onClick={() => handleDayToggle(index)}
                      color={formData.frequencyDays?.includes(index) ? 'primary' : 'default'}
                      variant={formData.frequencyDays?.includes(index) ? 'filled' : 'outlined'}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </FormControl>
            )}
            
            {formData.frequency !== 'custom' && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="frequency-count-label">How Many Times</InputLabel>
                <Select
                  labelId="frequency-count-label"
                  id="frequencyValue"
                  name="frequencyValue"
                  value={formData.frequencyValue.toString()}
                  onChange={handleSelectChange}
                  label="How Many Times"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                    <MenuItem key={count} value={count}>
                      {count} time{count !== 1 && 's'} per {formData.frequency === 'daily' ? 'day' : formData.frequency === 'weekly' ? 'week' : 'month'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#7f8c8d'].map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: color,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: formData.color === color ? '2px solid black' : '2px solid transparent',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            resetFormData();
            setEditingHabitId(null);
            setShowAddForm(false);
          }}>Cancel</Button>
          <Button 
            onClick={isEditing ? handleEditHabit : handleAddHabit} 
            variant="contained"
            color="primary"
            disabled={!formData.name.trim()}
          >
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render categories filter
  const renderCategoriesFilter = () => {
    if (categoriesLoading) {
      return <CircularProgress size={24} />;
    }
    
    if (categories.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mb: 3, display: showCategories ? 'block' : 'none' }}>
        <Typography variant="subtitle1" gutterBottom>
          Filter by Category
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All Categories"
            onClick={() => handleCategorySelect(null)}
            color={selectedCategoryId === null ? 'primary' : 'default'}
            variant={selectedCategoryId === null ? 'filled' : 'outlined'}
            sx={{ m: 0.5 }}
          />
          <Chip
            label="Uncategorized"
            onClick={() => handleCategorySelect('uncategorized')}
            color={selectedCategoryId === 'uncategorized' ? 'primary' : 'default'}
            variant={selectedCategoryId === 'uncategorized' ? 'filled' : 'outlined'}
            sx={{ m: 0.5 }}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              onClick={() => handleCategorySelect(category.id)}
              color={selectedCategoryId === category.id ? 'primary' : 'default'}
              variant={selectedCategoryId === category.id ? 'filled' : 'outlined'}
              sx={{ 
                m: 0.5,
                bgcolor: selectedCategoryId === category.id ? `${category.color}40` : 'transparent',
                borderColor: category.color,
                '& .MuiChip-label': {
                  color: selectedCategoryId === category.id ? 'text.primary' : 'text.secondary'
                }
              }}
              icon={
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: category.color 
                  }} 
                />
              }
            />
          ))}
        </Box>
      </Box>
    );
  };

  // Render habit card
  const renderHabitCard = (habit: Habit) => {
    const stats = getHabitStats(habit);
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = isHabitCompletedOnDate(habit, today);
    const category = habit.categoryId ? getCategoryById(habit.categoryId) : undefined;
    const habitColor = habit.color || (category ? category.color : '#3f51b5');
    
    return (
      <Card 
        key={habit.id} 
        sx={{ 
          mb: 2, 
          borderLeft: `4px solid ${habitColor}`,
          width: '100%'
        }}
      >
        <CardContent sx={{ pb: 1, pt: isMobile ? 1.5 : 2, px: isMobile ? 1.5 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant={isMobile ? "body1" : "h6"} component="h3" sx={{ fontWeight: 'bold' }}>
                {habit.name}
              </Typography>
              
              {habit.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {habit.description}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                <Chip 
                  label={getFrequencyText(habit)} 
                  size="small" 
                  sx={{ backgroundColor: `${habitColor}20` }}
                />
                
                {category && (
                  <Chip 
                    label={category.name}
                    size="small"
                    sx={{ 
                      backgroundColor: `${category.color}20`,
                      borderColor: category.color,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                    icon={
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: category.color 
                        }} 
                      />
                    }
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex' }}>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditClick(habit)}
                    sx={{ ml: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => deleteHabit(habit.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  {isCompleted ? 'Completed' : 'Mark as done'}
                </Typography>
                
                <Tooltip title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}>
                  <Checkbox
                    checked={isCompleted}
                    onChange={() => completeHabit(habit.id, today, !isCompleted)}
                    icon={<CloseIcon />}
                    checkedIcon={<CheckIcon />}
                    sx={{
                      color: 'text.disabled',
                      '&.Mui-checked': {
                        color: habitColor,
                      },
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={stats.completionRate} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: `${habitColor}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: habitColor,
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {stats.completed} / {stats.total} completed
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                {stats.completionRate}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render habits list
  const renderHabitsList = () => {
    const habitsToShow = getFilteredHabits();
    
    if (loading || categoriesLoading) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <LinearProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading habits...
          </Typography>
        </Box>
      );
    }
    
    if (habitsToShow.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {showAllHabits 
              ? "You haven't created any habits yet." 
              : "No habits scheduled for today."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{ mt: 2 }}
          >
            Add Your First Habit
          </Button>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={isMobile ? 1 : 2}>
        {habitsToShow.map((habit) => (
          <Grid item xs={12} sm={6} md={4} key={habit.id}>
            {renderHabitCard(habit)}
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Habits Tracker
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab label="Habits" />
          <Tab label="Categories" />
        </Tabs>
      </Box>
      
      {tabValue === 0 ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddForm(true)}
              >
                Add Habit
              </Button>
              
              <Button
                variant={showAllHabits ? "contained" : "outlined"}
                color={showAllHabits ? "secondary" : "primary"}
                onClick={() => setShowAllHabits(!showAllHabits)}
              >
                {showAllHabits ? "Show Today's Habits" : "Show All Habits"}
              </Button>
            </Box>
            
            <Button
              variant={showCategories ? "contained" : "outlined"}
              color={showCategories ? "secondary" : "primary"}
              onClick={toggleCategoriesView}
              startIcon={<CategoryIcon />}
            >
              {showCategories ? "Hide Categories" : "Show Categories"}
            </Button>
          </Box>
          
          {renderCategoriesFilter()}
          {renderHabitsList()}
        </>
      ) : (
        <HabitCategories />
      )}
      
      {renderHabitForm()}
    </Box>
  );
};

export default Habits; 