import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Divider, Paper, Switch, FormControlLabel, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { seedDefaultCategories, resetDefaultCategories } from '../../firebase/seedDefaultCategories';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings, updateSettings, isAdmin } = useSettings();
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);
  
  // Handle toggling settings
  const handleToggle = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ [setting]: event.target.checked });
  };
  
  // Handle seeding default categories
  const handleSeedCategories = async () => {
    try {
      setSeedingStatus('Seeding default categories...');
      await seedDefaultCategories();
      setSeedingStatus('Default categories seeded successfully!');
    } catch (error) {
      console.error('Error seeding categories:', error);
      setSeedingStatus('Error seeding categories. Check console for details.');
    }
  };
  
  // Handle resetting default categories
  const handleResetCategories = async () => {
    if (window.confirm('This will delete and recreate all default categories. Are you sure?')) {
      try {
        setSeedingStatus('Resetting default categories...');
        await resetDefaultCategories();
        setSeedingStatus('Default categories reset successfully!');
      } catch (error) {
        console.error('Error resetting categories:', error);
        setSeedingStatus('Error resetting categories. Check console for details.');
      }
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          App Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.darkMode}
              onChange={handleToggle('darkMode')}
              color="primary"
            />
          }
          label="Dark Mode"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.notifications}
              onChange={handleToggle('notifications')}
              color="primary"
            />
          }
          label="Enable Notifications"
        />
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Pomodoro Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoStartPomodoro}
              onChange={handleToggle('autoStartPomodoro')}
              color="primary"
            />
          }
          label="Auto-start next timer"
        />
      </Paper>
      
      {/* Admin Section */}
      {isAdmin && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Admin Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Habit Categories
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSeedCategories}
              sx={{ mr: 2, mb: 1 }}
            >
              Seed Default Categories
            </Button>
            
            <Button 
              variant="outlined" 
              color="warning" 
              onClick={handleResetCategories}
              sx={{ mb: 1 }}
            >
              Reset Default Categories
            </Button>
            
            {seedingStatus && (
              <Alert 
                severity={seedingStatus.includes('Error') ? 'error' : 'success'}
                sx={{ mt: 2 }}
              >
                {seedingStatus}
              </Alert>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SettingsPage; 