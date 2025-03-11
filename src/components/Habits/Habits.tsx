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
  SelectChangeEvent,
  useTheme,
  useMediaQuery
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
    loading,
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {isEditing ? 'Edit Habit' : 'Add New Habit'}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
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
              autoFocus
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="frequency-type-label">Frequency</InputLabel>
              <Select
                labelId="frequency-type-label"
                id="frequencyType"
                name="frequencyType"
                value={formData.frequencyType}
                label="Frequency"
                onChange={handleSelectChange}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            
            {formData.frequencyType !== 'custom' && (
              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel id="frequency-count-label">
                  {formData.frequencyType === 'daily' 
                    ? 'Times per day' 
                    : formData.frequencyType === 'weekly' 
                      ? 'Times per week' 
                      : 'Times per month'}
                </InputLabel>
                <Select
                  labelId="frequency-count-label"
                  id="frequencyCount"
                  name="frequencyCount"
                  value={formData.frequencyCount.toString()}
                  label={formData.frequencyType === 'daily' 
                    ? 'Times per day' 
                    : formData.frequencyType === 'weekly' 
                      ? 'Times per week' 
                      : 'Times per month'}
                  onChange={handleSelectChange}
                >
                  {[...Array(30)].map((_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {(formData.frequencyType === 'weekly' || formData.frequencyType === 'custom') && (
              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  On which days?
                </Typography>
                <ToggleButtonGroup
                  value={formData.frequencyDays}
                  onChange={(_, newDays) => {
                    setFormData({
                      ...formData,
                      frequencyDays: newDays,
                    });
                  }}
                  aria-label="days of week"
                  sx={{ 
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}
                >
                  {getDayNames().map((day, index) => (
                    <ToggleButton 
                      key={day} 
                      value={index}
                      aria-label={day}
                      sx={{ 
                        flex: isMobile ? '1 0 30%' : '1 0 14%',
                        margin: '2px',
                        padding: isMobile ? '6px 8px' : '8px 12px'
                      }}
                    >
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </FormControl>
            )}
            
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel id="color-label">Color</InputLabel>
              <Select
                labelId="color-label"
                id="color"
                name="color"
                value={formData.color}
                label="Color"
                onChange={handleSelectChange}
              >
                <MenuItem value="#3498db">Blue</MenuItem>
                <MenuItem value="#2ecc71">Green</MenuItem>
                <MenuItem value="#e74c3c">Red</MenuItem>
                <MenuItem value="#f39c12">Orange</MenuItem>
                <MenuItem value="#9b59b6">Purple</MenuItem>
                <MenuItem value="#1abc9c">Teal</MenuItem>
                <MenuItem value="#34495e">Dark</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelEdit} variant="outlined">Cancel</Button>
          <Button 
            onClick={isEditing ? handleUpdateHabit : handleAddHabit}
            variant="contained"
            color="primary"
          >
            {isEditing ? 'Update' : 'Add Habit'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render habit card
  const renderHabitCard = (habit: Habit) => {
    const stats = getHabitStats(habit);
    const isCompleted = getCompletionStatus(habit);
    
    return (
      <Card 
        key={habit.id} 
        sx={{ 
          mb: 2, 
          borderLeft: `4px solid ${habit.color}`,
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
              
              <Chip 
                label={formatFrequency(habit)} 
                size="small" 
                sx={{ mt: 1, backgroundColor: `${habit.color}20` }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex' }}>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditHabit(habit)}
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
                    onChange={() => toggleHabitCompletion(habit.id)}
                    icon={<CloseIcon />}
                    checkedIcon={<CheckIcon />}
                    sx={{
                      color: 'text.disabled',
                      '&.Mui-checked': {
                        color: habit.color,
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
                backgroundColor: `${habit.color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: habit.color,
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {stats.completedCount} / {stats.totalCount} completed
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
    const habitsToShow = showAllHabits ? habits : getHabitsForToday();
    
    if (loading) {
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

  // Render dashboard
  const renderDashboard = () => {
    const todayHabits = getHabitsForToday();
    const completedHabits = getCompletedHabitsForToday();
    const remainingHabits = getRemainingHabitsForToday();
    const completionRate = todayHabits.length > 0 
      ? Math.round((completedHabits.length / todayHabits.length) * 100) 
      : 0;
    
    return (
      <Box>
        <Paper sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Today's Progress
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={completionRate} 
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {todayHabits.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {completedHabits.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {remainingHabits.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Today's Habits
          </Typography>
          
          {todayHabits.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No habits scheduled for today.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {todayHabits.map((habit) => {
                const isCompleted = getCompletionStatus(habit);
                
                return (
                  <Paper 
                    key={habit.id} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: `4px solid ${habit.color}`,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1">
                        {habit.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFrequency(habit)}
                      </Typography>
                    </Box>
                    
                    <Checkbox
                      checked={isCompleted}
                      onChange={() => toggleHabitCompletion(habit.id)}
                      icon={<CloseIcon />}
                      checkedIcon={<CheckIcon />}
                      sx={{
                        color: 'text.disabled',
                        '&.Mui-checked': {
                          color: habit.color,
                        },
                      }}
                    />
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0,
        mb: 3 
      }}>
        <Typography variant="h5" component="h1">
          Habits Tracker
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          <Button
            variant={showAllHabits ? "outlined" : "contained"}
            onClick={() => setShowAllHabits(!showAllHabits)}
            startIcon={<RefreshIcon />}
            size={isMobile ? "small" : "medium"}
            sx={{ flex: isMobile ? 1 : 'none' }}
          >
            {showAllHabits ? "Today's Habits" : "All Habits"}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddForm(true)}
            startIcon={<AddIcon />}
            size={isMobile ? "small" : "medium"}
            sx={{ flex: isMobile ? 1 : 'none' }}
          >
            Add Habit
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab label="Habits" />
          <Tab label="Dashboard" />
        </Tabs>
      </Box>
      
      <Box>
        {tabValue === 0 ? renderHabitsList() : renderDashboard()}
      </Box>
      
      {renderHabitForm()}
    </Box>
  );
};

export default Habits; 