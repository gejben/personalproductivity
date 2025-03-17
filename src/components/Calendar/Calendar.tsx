import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApiCalendar from 'react-google-calendar-api';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Event as EventIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

// Google Calendar API configuration
const config = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
  scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ],
  immediateAuth: false,
  prompt: 'consent',
  ux_mode: 'popup',
  redirect_uri: window.location.origin + '/calendar'
};

// Check if API credentials are set
const areCredentialsSet = 
  process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'YOUR_CLIENT_ID' && 
  process.env.REACT_APP_GOOGLE_API_KEY !== 'YOUR_API_KEY' &&
  process.env.REACT_APP_GOOGLE_CLIENT_ID !== '' &&
  process.env.REACT_APP_GOOGLE_API_KEY !== '';

// Create ApiCalendar instance
const apiCalendar = new ApiCalendar(config);

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
}

const Calendar: React.FC = () => {
  const auth = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCalendarSignedIn, setIsCalendarSignedIn] = useState<boolean>(false);
  const [showAddEventForm, setShowAddEventForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialsError] = useState<boolean>(!areCredentialsSet);
  const [autoAuthChecked, setAutoAuthChecked] = useState<boolean>(false);
  
  // Form state for adding events
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    startDateTime: new Date(),
    endDateTime: new Date(new Date().getTime() + 60 * 60 * 1000),
  });
  
  // Handle Google Calendar sign-in
  const handleSignInClick = () => {
    setError(null);
    
    // Check if credentials are properly set
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID === '' || 
        !process.env.REACT_APP_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY === '') {
      setError('Google Calendar API credentials are not properly configured. Please check your .env file.');
      return;
    }
    
    // Force authentication with specific scopes
    const handleAuth = async () => {
      try {
        await apiCalendar.handleAuthClick();
        setIsCalendarSignedIn(true);
        await fetchEvents();
      } catch (error: any) {
        if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
          setError('Authentication failed. Please verify your Google Cloud Console settings and try again.');
        } else if (error.error === 'popup_blocked_by_browser') {
          setError('Authentication popup was blocked. Please allow popups for this site and try again.');
        } else if (error.error === 'access_denied') {
          if (error.message && error.message.includes('verifieringsprocess')) {
            setError(
              'This app is currently in testing mode. Please contact the developer to be added as a test user. ' +
              'If you are the developer, make sure to add your email as a test user in the Google Cloud Console.'
            );
          } else {
            setError('You denied access to your Google Calendar. Please try again and approve the permissions.');
          }
        } else if (error.error === 'redirect_uri_mismatch' || (error.message && error.message.includes('redirect_uri_mismatch'))) {
          setError(
            'Redirect URI mismatch error. Please verify that ' + config.redirect_uri + 
            ' is added as an authorized redirect URI in your Google Cloud Console project.'
          );
        } else {
          setError(`Failed to sign in to Google Calendar: ${error.message || 'Unknown error'}`);
        }
      }
    };
    
    handleAuth();
  };
  
  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async () => {
    if (!isCalendarSignedIn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!apiCalendar.sign) {
        setError('Session expired. Please sign in again.');
        setIsCalendarSignedIn(false);
        setLoading(false);
        return;
      }
      
      const calendarId = 'primary';
      console.log('Fetching events for calendar:', calendarId);
      
      const result = await apiCalendar.listEvents({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      console.log('Events response:', result);
      
      if (result && result.result && result.result.items) {
        console.log('Found events:', result.result.items.length);
        setEvents(result.result.items);
      } else {
        console.log('No events found or invalid response format');
        setEvents([]);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Handle authentication errors
      if (error.status === 401 || (error.result && error.result.error && (error.result.error.status === 401 || error.result.error.status === 'UNAUTHENTICATED'))) {
        setError('Authentication error. Please sign out and sign in again.');
        setIsCalendarSignedIn(false);
      } else if (error.status === 404) {
        setError('Calendar not found. Make sure you have access to the calendar and the Google Calendar API is enabled.');
      } else {
        setError(`Failed to fetch events: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isCalendarSignedIn]);
  
  // Function to check if user is authorized and automatically trigger auth flow if needed
  const checkAndTriggerAuth = useCallback(async () => {
    if (credentialsError || autoAuthChecked || !areCredentialsSet) return;
    
    try {
      console.log('Checking if calendar authorization is needed...');
      // First check if we're already authenticated
      const signedIn = apiCalendar.sign;
      console.log('Google Calendar sign status:', signedIn);
      
      if (signedIn) {
        console.log('Already authenticated with Google Calendar, fetching events...');
        setIsCalendarSignedIn(true);
        await fetchEvents();
        return;
      }
      
      // If we're not authenticated but the user is logged into the app,
      // automatically trigger the auth flow
      if (auth.currentUser && !isCalendarSignedIn) {
        console.log('User is logged into the app but not Google Calendar, triggering auth flow...');
        // Set a slight delay to ensure UI is fully rendered
        setTimeout(() => {
          handleSignInClick();
        }, 1000);
      } else {
        console.log('User is not signed in to Google Calendar.');
        setIsCalendarSignedIn(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsCalendarSignedIn(false);
    } finally {
      setAutoAuthChecked(true);
      setLoading(false);
    }
  }, [auth.currentUser, isCalendarSignedIn, credentialsError, autoAuthChecked, areCredentialsSet, fetchEvents]);
  
  // Check for existing authentication on component mount and trigger flow if needed
  useEffect(() => {
    if (areCredentialsSet) {
      checkAndTriggerAuth();
    } else {
      console.warn('Google Calendar API credentials are not properly configured.');
      setLoading(false);
    }
  }, [checkAndTriggerAuth, areCredentialsSet]);

  // Handle Google Calendar sign-out
  const handleSignOutClick = () => {
    apiCalendar.handleSignoutClick();
    setIsCalendarSignedIn(false);
    setEvents([]);
  };
  
  // Add event to Google Calendar
  const addEvent = async () => {
    if (!isCalendarSignedIn) return;
    
    setLoading(true);
    setError(null);
    
    const event = {
      summary: formData.summary,
      description: formData.description,
      location: formData.location,
      start: {
        dateTime: formData.startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: formData.endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    
    try {
      await apiCalendar.createEvent(event);
      setShowAddEventForm(false);
      resetFormData();
      fetchEvents();
    } catch (error: any) {
      console.error('Error adding event:', error);
      setError('Failed to add event. Please try again.');
      setLoading(false);
    }
  };

  // Delete event from Google Calendar
  const deleteEvent = async (eventId: string) => {
    if (!isCalendarSignedIn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await apiCalendar.deleteEvent(eventId);
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
      setLoading(false);
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      summary: '',
      description: '',
      location: '',
      startDateTime: new Date(),
      endDateTime: new Date(new Date().getTime() + 60 * 60 * 1000),
    });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle date changes
  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        [name]: date,
      });
      
      // If start date is changed and it's after end date, update end date
      if (name === 'startDateTime' && date > formData.endDateTime) {
        setFormData({
          ...formData,
          startDateTime: date,
          endDateTime: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour later
        });
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render add event form
  const renderAddEventForm = () => {
    return (
      <Dialog 
        open={showAddEventForm} 
        onClose={() => setShowAddEventForm(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Add New Event
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Box sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="summary"
              label="Event Title"
              name="summary"
              value={formData.summary}
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
            
            <TextField
              margin="normal"
              fullWidth
              id="location"
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={formData.startDateTime}
                    onChange={(newDate) => handleDateChange('startDateTime', newDate)}
                    sx={{ width: '100%', mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={formData.endDateTime}
                    onChange={(newDate) => handleDateChange('endDateTime', newDate)}
                    minDateTime={formData.startDateTime}
                    sx={{ width: '100%', mb: 2 }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setShowAddEventForm(false)} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={addEvent}
            variant="contained"
            color="primary"
            disabled={!formData.summary.trim()}
          >
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Google Calendar Integration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {credentialsError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Google Calendar API credentials are not properly configured.
        </Alert>
      ) : !isCalendarSignedIn ? (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSignInClick}
            startIcon={<EventIcon />}
          >
            Sign in to Google Calendar
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowAddEventForm(true)}
                startIcon={<AddIcon />}
                disabled={loading}
              >
                Add Event
              </Button>
              <Button
                variant="outlined"
                onClick={fetchEvents}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleSignOutClick}
              disabled={loading}
            >
              Sign Out
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : events.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
              <Typography variant="h6" color="text.secondary">
                No events found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Event" to create your first event
              </Typography>
            </Paper>
          ) : (
            <List>
              {events.map((event) => (
                <React.Fragment key={event.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => deleteEvent(event.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={event.summary}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {formatDate(event.start.dateTime)}
                          </Typography>
                          {event.location && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              {' • '}{event.location}
                            </Typography>
                          )}
                          {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {event.description}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </>
      )}

      {renderAddEventForm()}
    </Box>
  );
};

export default Calendar; 