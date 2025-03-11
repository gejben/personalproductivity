import React, { useState } from 'react';
import { useHabits, Habit, FrequencyType, HabitStats } from '../../contexts/HabitsContext';
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
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const Habits: React.FC = () => {
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getHabitStats,
    getHabitsForToday,
    getCompletedHabitsForToday,
    getRemainingHabitsForToday,
    getCompletionStatus,
  } = useHabits();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Form state for adding/editing habits
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    frequencyType: FrequencyType;
    frequencyCount: number;
    frequencyDays: number[];
    color: string;
  }>({
    name: '',
    description: '',
    frequencyType: 'daily',
    frequencyCount: 1,
    frequencyDays: [],
    color: '#3498db',
  });

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      frequencyType: 'daily',
      frequencyCount: 1,
      frequencyDays: [],
      color: '#3498db',
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

  // Handle form submission for adding a new habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    // Create new habit
    addHabit({
      name: formData.name,
      description: formData.description,
      frequencyType: formData.frequencyType,
      frequencyCount: formData.frequencyCount,
      frequencyDays: formData.frequencyDays.length > 0 ? formData.frequencyDays : undefined,
      color: formData.color,
      active: true,
    });

    // Reset form and hide it
    resetFormData();
    setShowAddForm(false);
  };

  // Handle form submission for editing a habit
  const handleUpdateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingHabitId) return;
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    // Update habit
    updateHabit(editingHabitId, {
      name: formData.name,
      description: formData.description,
      frequencyType: formData.frequencyType,
      frequencyCount: formData.frequencyCount,
      frequencyDays: formData.frequencyDays.length > 0 ? formData.frequencyDays : undefined,
      color: formData.color,
    });

    // Reset form and exit edit mode
    resetFormData();
    setEditingHabitId(null);
  };

  // Start editing a habit
  const handleEditHabit = (habit: Habit) => {
    setFormData({
      name: habit.name,
      description: habit.description,
      frequencyType: habit.frequencyType,
      frequencyCount: habit.frequencyCount,
      frequencyDays: habit.frequencyDays || [],
      color: habit.color,
    });
    setEditingHabitId(habit.id);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    resetFormData();
    setEditingHabitId(null);
    setShowAddForm(false);
  };

  // Format frequency text
  const formatFrequency = (habit: Habit): string => {
    switch (habit.frequencyType) {
      case 'daily':
        return habit.frequencyCount === 1
          ? 'Daily'
          : `${habit.frequencyCount} times a day`;
      case 'weekly':
        return habit.frequencyCount === 1
          ? 'Weekly'
          : `${habit.frequencyCount} times a week`;
      case 'monthly':
        return habit.frequencyCount === 1
          ? 'Monthly'
          : `${habit.frequencyCount} times a month`;
      case 'custom':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return habit.frequencyDays && habit.frequencyDays.length > 0
          ? `On: ${habit.frequencyDays.map(d => days[d]).join(', ')}`
          : 'Custom';
      default:
        return '';
    }
  };

  // Get day names for frequency selection
  const getDayNames = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  // Render habit form (add/edit)
  const renderHabitForm = () => {
    const isEditing = !!editingHabitId;
    
    return (
      <Dialog 
        open={showAddForm || !!editingHabitId} 
        onClose={handleCancelEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditing ? 'Edit Habit' : 'Add New Habit'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={isEditing ? handleUpdateHabit : handleAddHabit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Habit Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Morning Exercise"
              autoFocus
            />

            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your habit..."
              multiline
              rows={3}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="frequency-type-label">Frequency</InputLabel>
              <Select
                labelId="frequency-type-label"
                id="frequencyType"
                name="frequencyType"
                value={formData.frequencyType}
                onChange={handleSelectChange}
                label="Frequency"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              id="frequencyCount"
              label={`Times per ${formData.frequencyType.slice(0, -2)}`}
              name="frequencyCount"
              type="number"
              value={formData.frequencyCount}
              onChange={handleInputChange}
              inputProps={{ min: 1, max: 30 }}
            />

            {(formData.frequencyType === 'weekly' || formData.frequencyType === 'custom') && (
              <FormControl fullWidth margin="normal">
                <Typography variant="subtitle2" gutterBottom>
                  Days of the Week
                </Typography>
                <ToggleButtonGroup
                  value={formData.frequencyDays}
                  onChange={(e, newDays) => {
                    setFormData({
                      ...formData,
                      frequencyDays: newDays as number[]
                    });
                  }}
                  aria-label="days of week"
                >
                  {getDayNames().map((day, index) => (
                    <ToggleButton 
                      key={day} 
                      value={index}
                      aria-label={day}
                      sx={{ minWidth: 40 }}
                    >
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </FormControl>
            )}

            <TextField
              margin="normal"
              fullWidth
              id="color"
              label="Color"
              name="color"
              type="color"
              value={formData.color}
              onChange={handleInputChange}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button 
            onClick={isEditing ? handleUpdateHabit : handleAddHabit}
            variant="contained"
          >
            {isEditing ? 'Update' : 'Add'} Habit
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render habit item
  const renderHabitItem = (habit: Habit) => {
    const stats = getHabitStats(habit.id);
    const isCompletedToday = getCompletionStatus(habit.id, new Date());
    
    return (
      <Card 
        key={habit.id} 
        sx={{ 
          mb: 2, 
          borderLeft: `4px solid ${habit.color}`,
          opacity: habit.active ? 1 : 0.6
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" component="h3">
                {habit.name}
              </Typography>
              {habit.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {habit.description}
                </Typography>
              )}
              <Chip 
                label={formatFrequency(habit)} 
                size="small" 
                sx={{ mt: 1, mr: 1 }}
              />
            </Box>
            <Box>
              <IconButton 
                size="small" 
                onClick={() => handleEditHabit(habit)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => deleteHabit(habit.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Current Streak
                </Typography>
                <Typography variant="h6">
                  {stats.currentStreak} days
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Longest Streak
                </Typography>
                <Typography variant="h6">
                  {stats.longestStreak} days
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Completion Rate
                </Typography>
                <Typography variant="h6">
                  {stats.completionRate}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Total Completions
                </Typography>
                <Typography variant="h6">
                  {stats.totalCompletions}
                </Typography>
              </Grid>
            </Grid>
            
            <LinearProgress 
              variant="determinate" 
              value={stats.completionRate} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
        <CardActions>
          <Button
            startIcon={isCompletedToday ? <RefreshIcon /> : <CheckIcon />}
            onClick={() => toggleHabitCompletion(habit.id, new Date())}
            color={isCompletedToday ? "secondary" : "primary"}
            variant={isCompletedToday ? "outlined" : "contained"}
            fullWidth
          >
            {isCompletedToday ? 'Completed Today' : 'Mark Complete'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Get habits to display based on selected tab
  const getDisplayedHabits = () => {
    switch (tabValue) {
      case 0: // Today's habits
        return getHabitsForToday();
      case 1: // All habits
        return habits;
      default:
        return getHabitsForToday();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Habit Tracker
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowAddForm(true)}
        >
          Add Habit
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Today's Habits" />
          <Tab label="All Habits" />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6">
                {getHabitsForToday().length}
              </Typography>
              <Typography variant="body2">
                Habits Today
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="h6">
                {getCompletedHabitsForToday().length}
              </Typography>
              <Typography variant="body2">
                Completed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <Typography variant="h6">
                {getRemainingHabitsForToday().length}
              </Typography>
              <Typography variant="body2">
                Remaining
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {getDisplayedHabits().length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {tabValue === 0 
              ? "You don't have any habits scheduled for today." 
              : "You haven't created any habits yet."}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{ mt: 2 }}
          >
            Add Your First Habit
          </Button>
        </Paper>
      ) : (
        <Box>
          {getDisplayedHabits().map(renderHabitItem)}
        </Box>
      )}

      {renderHabitForm()}
    </Box>
  );
};

export default Habits; 