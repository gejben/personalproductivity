import React, { useState } from 'react';
import { useGoals, Goal, GoalTargetType, GoalPeriodType } from '../../contexts/GoalsContext';
import { useHabits } from '../../contexts/HabitsContext';
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
  Grid,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Flag as FlagIcon
} from '@mui/icons-material';

const Goals: React.FC = () => {
  const {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalStats,
    getGoalsByCategory,
    getActiveGoals,
    getCompletedGoals,
    getFailedGoals,
    archiveGoal,
    unarchiveGoal,
    addItemToGoal,
    removeItemFromGoal,
    updateItemWeight
  } = useGoals();

  const { habits, categories } = useHabits();

  // Helper function to get habit by ID
  const getHabitById = (id: string) => {
    return habits.find(h => h.id === id);
  };

  // Helper function to get category by ID
  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'completed' | 'failed'>('active');

  // Form state for adding/editing goals
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    categoryId: string;
    targetType: GoalTargetType;
    targetValue: number;
    targetPeriod?: GoalPeriodType;
    targetPeriodValue?: number;
    startDate?: string;
    endDate?: string;
    color: string;
  }>({
    name: '',
    description: '',
    categoryId: '',
    targetType: 'count',
    targetValue: 0,
    color: '#3f51b5'
  });

  // State for managing goal items
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'habit' | 'task'>('habit');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemWeight, setItemWeight] = useState<number>(1);

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      targetType: 'count',
      targetValue: 0,
      color: '#3f51b5'
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

  // Handle form submission for adding a goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.categoryId || !formData.targetValue) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const target = {
        type: formData.targetType,
        value: formData.targetValue,
        period: formData.targetPeriod,
        periodValue: formData.targetPeriodValue
      };

      await addGoal({
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        target,
        items: [], // Will be populated later when adding items
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        color: formData.color
      });

      resetFormData();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Error adding goal');
    }
  };

  // Handle form submission for editing a goal
  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGoalId) return;

    try {
      const target = {
        type: formData.targetType,
        value: formData.targetValue,
        period: formData.targetPeriod,
        periodValue: formData.targetPeriodValue
      };

      await updateGoal(editingGoalId, {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        target,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        color: formData.color
      });

      resetFormData();
      setEditingGoalId(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Error updating goal');
    }
  };

  // Edit a goal (populate form with goal data)
  const handleEditClick = (goal: Goal) => {
    setFormData({
      name: goal.name,
      description: goal.description || '',
      categoryId: goal.categoryId,
      targetType: goal.target.type,
      targetValue: goal.target.value,
      targetPeriod: goal.target.period,
      targetPeriodValue: goal.target.periodValue,
      startDate: goal.startDate?.toISOString().split('T')[0],
      endDate: goal.endDate?.toISOString().split('T')[0],
      color: goal.color || '#3f51b5'
    });
    setEditingGoalId(goal.id);
  };

  // Get goals based on view mode
  const getFilteredGoals = (): Goal[] => {
    if (selectedCategoryId) {
      return getGoalsByCategory(selectedCategoryId);
    }

    switch (viewMode) {
      case 'active':
        return getActiveGoals();
      case 'completed':
        return getCompletedGoals();
      case 'failed':
        return getFailedGoals();
      default:
        return [];
    }
  };

  // Handle adding item to goal
  const handleAddItem = async () => {
    if (!selectedGoalId || !selectedItemId) return;

    try {
      await addItemToGoal(selectedGoalId, selectedItemId, selectedItemType, itemWeight);
      setShowAddItemDialog(false);
      setSelectedGoalId(null);
      setSelectedItemId('');
      setItemWeight(1);
    } catch (error) {
      console.error('Error adding item to goal:', error);
      alert('Error adding item to goal');
    }
  };

  // Handle removing item from goal
  const handleRemoveItem = async (goalId: string, itemId: string) => {
    try {
      await removeItemFromGoal(goalId, itemId);
    } catch (error) {
      console.error('Error removing item from goal:', error);
      alert('Error removing item from goal');
    }
  };

  // Handle updating item weight
  const handleUpdateWeight = async (goalId: string, itemId: string, newWeight: number) => {
    try {
      await updateItemWeight(goalId, itemId, newWeight);
    } catch (error) {
      console.error('Error updating item weight:', error);
      alert('Error updating item weight');
    }
  };

  // Render goal form (add/edit)
  const renderGoalForm = () => (
    <Dialog 
      open={showAddForm || !!editingGoalId} 
      onClose={() => {
        setShowAddForm(false);
        setEditingGoalId(null);
        resetFormData();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editingGoalId ? 'Edit Goal' : 'Add New Goal'}
      </DialogTitle>
      <form onSubmit={editingGoalId ? handleEditGoal : handleAddGoal}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
            
            <FormControl fullWidth required>
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
            
            <FormControl fullWidth required>
              <InputLabel id="target-type-label">Target Type</InputLabel>
              <Select
                labelId="target-type-label"
                id="targetType"
                name="targetType"
                value={formData.targetType}
                onChange={handleSelectChange}
                label="Target Type"
              >
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="streak">Streak</MenuItem>
                <MenuItem value="composite">Composite</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Target Value"
              name="targetValue"
              type="number"
              value={formData.targetValue}
              onChange={handleInputChange}
              required
            />
            
            {formData.targetType !== 'composite' && (
              <>
                <FormControl fullWidth>
                  <InputLabel id="target-period-label">Period</InputLabel>
                  <Select
                    labelId="target-period-label"
                    id="targetPeriod"
                    name="targetPeriod"
                    value={formData.targetPeriod || ''}
                    onChange={handleSelectChange}
                    label="Period"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                
                {formData.targetPeriod === 'custom' && (
                  <TextField
                    fullWidth
                    label="Custom Period (days)"
                    name="targetPeriodValue"
                    type="number"
                    value={formData.targetPeriodValue || ''}
                    onChange={handleInputChange}
                  />
                )}
              </>
            )}
            
            <TextField
              fullWidth
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate || ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="Color"
              name="color"
              type="color"
              value={formData.color}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddForm(false);
            setEditingGoalId(null);
            resetFormData();
          }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {editingGoalId ? 'Update' : 'Add'} Goal
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );

  // Render add item dialog
  const renderAddItemDialog = () => (
    <Dialog
      open={showAddItemDialog}
      onClose={() => {
        setShowAddItemDialog(false);
        setSelectedGoalId(null);
        setSelectedItemId('');
        setItemWeight(1);
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add Item to Goal</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Item Type</InputLabel>
            <Select
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value as 'habit' | 'task')}
              label="Item Type"
            >
              <MenuItem value="habit">Habit</MenuItem>
              <MenuItem value="task">Task</MenuItem>
            </Select>
          </FormControl>

          {selectedItemType === 'habit' ? (
            <FormControl fullWidth>
              <InputLabel>Select Habit</InputLabel>
              <Select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                label="Select Habit"
              >
                {habits.map((habit) => (
                  <MenuItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              label="Task ID"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            />
          )}

          <TextField
            fullWidth
            label="Weight"
            type="number"
            value={itemWeight}
            onChange={(e) => setItemWeight(Number(e.target.value))}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setShowAddItemDialog(false);
          setSelectedGoalId(null);
          setSelectedItemId('');
          setItemWeight(1);
        }}>
          Cancel
        </Button>
        <Button onClick={handleAddItem} variant="contained">
          Add Item
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render goal card
  const renderGoalCard = (goal: Goal) => {
    const stats = getGoalStats(goal);
    const category = getCategoryById(goal.categoryId);
    const goalColor = goal.color || (category ? category.color : '#3f51b5');
    
    return (
      <Card 
        key={goal.id} 
        sx={{ 
          mb: 2, 
          borderLeft: `4px solid ${goalColor}`,
          width: '100%'
        }}
      >
        <CardContent sx={{ pb: 1, pt: isMobile ? 1.5 : 2, px: isMobile ? 1.5 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant={isMobile ? "body1" : "h6"} component="h3" sx={{ fontWeight: 'bold' }}>
                {goal.name}
              </Typography>
              
              {goal.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {goal.description}
                </Typography>
              )}
              
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={category?.name || 'Uncategorized'} 
                  size="small"
                  sx={{ bgcolor: `${goalColor}20`, color: goalColor }}
                />
                <Chip 
                  label={`${goal.target.type} (${goal.target.value})`} 
                  size="small"
                  variant="outlined"
                />
                {goal.target.period && (
                  <Chip 
                    label={goal.target.period} 
                    size="small"
                    variant="outlined"
                  />
                )}
                <Chip 
                  label={stats.status} 
                  size="small"
                  color={
                    stats.status === 'completed' ? 'success' :
                    stats.status === 'failed' ? 'error' :
                    stats.status === 'in_progress' ? 'primary' :
                    'default'
                  }
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex' }}>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditClick(goal)}
                    sx={{ ml: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={goal.isArchived ? "Unarchive" : "Archive"}>
                  <IconButton 
                    size="small" 
                    onClick={() => goal.isArchived ? unarchiveGoal(goal.id) : archiveGoal(goal.id)}
                    sx={{ ml: 1 }}
                  >
                    {goal.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => deleteGoal(goal.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={stats.progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: `${goalColor}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: goalColor,
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {stats.currentValue} / {stats.targetValue}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                {Math.round(stats.progress)}%
              </Typography>
            </Box>
          </Box>
          
          {renderGoalItems(goal)}
        </CardContent>
      </Card>
    );
  };

  // Render goal items
  const renderGoalItems = (goal: Goal) => (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">Items</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedGoalId(goal.id);
            setShowAddItemDialog(true);
          }}
        >
          Add Item
        </Button>
      </Box>
      
      {goal.items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No items added yet
        </Typography>
      ) : (
        <Stack spacing={1}>
          {goal.items.map((item) => {
            const habit = item.type === 'habit' ? getHabitById(item.id) : null;
            return (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {item.type === 'habit' ? habit?.name || 'Unknown Habit' : `Task ${item.id}`}
                  </Typography>
                  <Chip
                    label={`Weight: ${item.weight || 1}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem(goal.id, item.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );

  // Render goals list
  const renderGoalsList = () => {
    const goalsToShow = getFilteredGoals();
    
    if (loading) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <LinearProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading goals...
          </Typography>
        </Box>
      );
    }
    
    if (goalsToShow.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {viewMode === 'active' 
              ? "You haven't created any goals yet." 
              : `No ${viewMode} goals.`}
          </Typography>
          {viewMode === 'active' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(true)}
              sx={{ mt: 2 }}
            >
              Add Your First Goal
            </Button>
          )}
        </Box>
      );
    }
    
    return (
      <Grid container spacing={isMobile ? 1 : 2}>
        {goalsToShow.map((goal) => (
          <Grid item xs={12} sm={6} md={4} key={goal.id}>
            {renderGoalCard(goal)}
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          Goals
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'active' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('active')}
          >
            Active
          </Button>
          <Button
            variant={viewMode === 'completed' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('completed')}
          >
            Completed
          </Button>
          <Button
            variant={viewMode === 'failed' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('failed')}
          >
            Failed
          </Button>
          {viewMode === 'active' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Add Goal
            </Button>
          )}
        </Box>
      </Box>

      {renderGoalForm()}
      {renderAddItemDialog()}
      {renderGoalsList()}
    </Box>
  );
};

export default Goals; 