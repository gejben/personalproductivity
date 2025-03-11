import React, { useState } from 'react';
import { useHabits, Habit, FrequencyType, HabitStats } from '../../contexts/HabitsContext';
import './Habits.css';

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
      <div className="habit-form-container">
        <h3>{isEditing ? 'Edit Habit' : 'Add New Habit'}</h3>
        <form onSubmit={isEditing ? handleUpdateHabit : handleAddHabit}>
          <div className="form-group">
            <label htmlFor="name">Habit Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Morning Exercise"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your habit..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="frequencyType">Frequency</label>
            <select
              id="frequencyType"
              name="frequencyType"
              value={formData.frequencyType}
              onChange={handleInputChange}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="frequencyCount">Times per {formData.frequencyType.slice(0, -2)}</label>
            <input
              type="number"
              id="frequencyCount"
              name="frequencyCount"
              value={formData.frequencyCount}
              onChange={handleInputChange}
              min="1"
              max="30"
            />
          </div>

          {(formData.frequencyType === 'weekly' || formData.frequencyType === 'custom') && (
            <div className="form-group">
              <label>Days of the Week</label>
              <div className="day-selector">
                {getDayNames().map((day, index) => (
                  <div
                    key={day}
                    className={`day-item ${
                      formData.frequencyDays.includes(index) ? 'selected' : ''
                    }`}
                    onClick={() => handleDayToggle(index)}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update Habit' : 'Add Habit'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render a single habit item
  const renderHabitItem = (habit: Habit) => {
    const stats = getHabitStats(habit.id);
    const isCompleted = getCompletionStatus(habit.id, new Date());
    
    return (
      <div
        className={`habit-item ${isCompleted ? 'completed' : ''}`}
        key={habit.id}
        style={{ borderLeftColor: habit.color }}
      >
        <div className="habit-header">
          <h3>{habit.name}</h3>
          <div className="habit-actions">
            <button
              className="btn-icon"
              onClick={() => handleEditHabit(habit)}
              title="Edit"
            >
              ✏️
            </button>
            <button
              className="btn-icon"
              onClick={() => deleteHabit(habit.id)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
        
        {habit.description && <p className="habit-description">{habit.description}</p>}
        
        <div className="habit-details">
          <span className="habit-frequency">{formatFrequency(habit)}</span>
          <div className="habit-stats">
            <span title="Current Streak">🔥 {stats.currentStreak}</span>
            <span title="Completion Rate">📊 {stats.completionRate}%</span>
          </div>
        </div>
        
        <button
          className={`habit-complete-btn ${isCompleted ? 'completed' : ''}`}
          onClick={() => toggleHabitCompletion(habit.id, new Date())}
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </button>
      </div>
    );
  };

  // Get habits to display based on filter
  const habitsToDisplay = showAllHabits ? habits : getHabitsForToday();
  const completedToday = getCompletedHabitsForToday().length;
  const remainingToday = getRemainingHabitsForToday().length;

  return (
    <div className="habits-container">
      <div className="habits-header">
        <h2>Habits</h2>
        <div className="habits-summary">
          <div className="habit-stat-item">
            <span className="stat-value">{completedToday}</span>
            <span className="stat-label">Completed Today</span>
          </div>
          <div className="habit-stat-item">
            <span className="stat-value">{remainingToday}</span>
            <span className="stat-label">Remaining Today</span>
          </div>
          <div className="habit-stat-item">
            <span className="stat-value">{habits.length}</span>
            <span className="stat-label">Total Habits</span>
          </div>
        </div>
      </div>

      <div className="habits-actions">
        <button
          className="btn-primary"
          onClick={() => {
            resetFormData();
            setShowAddForm(!showAddForm);
            setEditingHabitId(null);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add New Habit'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => setShowAllHabits(!showAllHabits)}
        >
          {showAllHabits ? 'Show Today\'s Habits' : 'Show All Habits'}
        </button>
      </div>

      {(showAddForm || editingHabitId) && renderHabitForm()}

      <div className="habits-list">
        {habitsToDisplay.length === 0 ? (
          <div className="no-habits">
            <p>No habits to display. Start by adding a new habit!</p>
          </div>
        ) : (
          habitsToDisplay.map(renderHabitItem)
        )}
      </div>
    </div>
  );
};

export default Habits; 