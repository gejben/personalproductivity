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
  ux_mode: 'redirect',
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

// Log configuration details (for debugging purposes)
console.log('Google Calendar API Configuration:');
console.log('- Client ID set:', !!process.env.REACT_APP_GOOGLE_CLIENT_ID);
console.log('- API Key set:', !!process.env.REACT_APP_GOOGLE_API_KEY);
console.log('- Scopes:', config.scope);
console.log('- UX Mode:', config.ux_mode);
console.log('- Redirect URI:', config.redirect_uri);

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
  const auth = useAuth(); // This is Firebase authentication
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCalendarSignedIn, setIsCalendarSignedIn] = useState<boolean>(false);
  const [showAddEventForm, setShowAddEventForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialsError] = useState<boolean>(!areCredentialsSet);
  const [apiTestStatus, setApiTestStatus] = useState<string | null>(null);
  const [autoAuthChecked, setAutoAuthChecked] = useState<boolean>(false);
  
  // Form state for adding events
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    startDateTime: new Date(),
    endDateTime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default to 1 hour later
  });
  
  // Additional debug information at component initialization
  console.log('Calendar component rendered');
  console.log('Initial isCalendarSignedIn state:', isCalendarSignedIn);
  console.log('Initial credentialsError state:', credentialsError);
  console.log('Firebase auth state:', !!auth.currentUser);
  
  // Handle Google Calendar sign-in
  const handleSignInClick = () => {
    setError(null);
    console.log('Attempting to sign in with Google Calendar...');
    console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Set (hidden for security)' : 'Not set');
    console.log('API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? 'Set (hidden for security)' : 'Not set');
    console.log('Using scopes:', config.scope);
    console.log('Redirect URI:', config.redirect_uri);
    
    // Check if credentials are properly set
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID === '' || 
        !process.env.REACT_APP_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY === '') {
      setError('Google Calendar API credentials are not properly configured. Please check your .env file.');
      return;
    }
    
    // Force authentication with specific scopes
    const handleAuth = async () => {
      try {
        // This will trigger the OAuth2 flow - with redirect mode, this may navigate away from the page
        console.log('Starting OAuth2 flow...');
        await apiCalendar.handleAuthClick();
        
        // If we get here (with redirect mode, we might not), update the UI
        console.log('Successfully signed in to Google Calendar');
        setIsCalendarSignedIn(true);
        
        // Test the API connection before fetching events
        const success = await testApiConnection();
        if (success) {
          await fetchEvents();
        }
      } catch (error: any) {
        console.error('Error signing in to Google Calendar:', error);
        
        // Log detailed error information
        if (error.result && error.result.error) {
          console.error('Error result:', error.result.error);
          console.error('Error status:', error.result.error.status);
          console.error('Error message:', error.result.error.message);
        } else {
          console.error('No specific error details available');
        }
        
        console.error('Full error details:', JSON.stringify(error, null, 2));
        
        // Specific error messages based on error type
        if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
          setError('Authentication failed. Please verify your Google Cloud Console settings and try again.');
        } else if (error.error === 'popup_blocked_by_browser') {
          setError('Authentication popup was blocked. Please allow popups for this site and try again.');
        } else if (error.error === 'access_denied') {
          setError('You denied access to your Google Calendar. Please try again and approve the permissions.');
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
  
  // Test the Google Calendar API connection
  const testApiConnection = async () => {
    setApiTestStatus('Testing API connection...');
    setError(null);
    
    try {
      // Check if we're authenticated
      if (!apiCalendar.sign) {
        console.error('Not authenticated. Please sign in first.');
        setApiTestStatus('Not authenticated. Please sign in first.');
        return false;
      }
      
      console.log('Authentication status: Signed in');
      
      // Try to get the calendar list first (requires less permissions)
      const response = await apiCalendar.listCalendars();
      console.log('Calendar list response:', response);
      setApiTestStatus('API connection successful! Calendar list retrieved.');
      return true;
    } catch (error: any) {
      console.error('Error testing Calendar API connection:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check for auth-related errors
      if (error.status === 401 || (error.result && error.result.error && error.result.error.status === 'UNAUTHENTICATED')) {
        setApiTestStatus('Authentication failed. Please sign out and sign in again.');
        return false;
      }
      
      setApiTestStatus(`API connection failed: ${error.message || 'Unknown error'}`);
      
      // Try a different API call to see if the issue is with the specific method
      try {
        const calendarId = 'primary';
        // Use a different method
        const calendarResponse = await apiCalendar.listEvents({
          calendarId: calendarId,
          timeMin: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // One week ago
          maxResults: 1,
        });
        console.log('Calendar response:', calendarResponse);
        setApiTestStatus('Calendar events retrieved directly. Issue might be with original query parameters.');
        return true;
      } catch (secondError: any) {
        console.error('Error on second API test:', secondError);
        setApiTestStatus(`All API tests failed. Check console for details.`);
        return false;
      }
    }
  };
  
  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async () => {
    if (!isCalendarSignedIn) return;
    
    setLoading(true);
    setError(null);
    console.log('Fetching events from Google Calendar...');
    
    try {
      // Verify we're still authenticated
      if (!apiCalendar.sign) {
        console.error('No longer authenticated. Please sign in again.');
        setError('Session expired. Please sign in again.');
        setIsCalendarSignedIn(false);
        setLoading(false);
        return;
      }
      
      // Try to use the primary calendar
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
      
      // Log detailed error information
      if (error.result && error.result.error) {
        console.error('Error result:', error.result.error);
        console.error('Error status:', error.result.error.status);
        console.error('Error message:', error.result.error.message);
      }
      
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
    setApiTestStatus(null);
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

  // Explicitly log the render decision for the sign-in button
  useEffect(() => {
    console.log('Render decision - isCalendarSignedIn:', isCalendarSignedIn);
    console.log('Render decision - credentialsError:', credentialsError);
    console.log('Should show sign-in button:', !isCalendarSignedIn && !credentialsError);
  }, [isCalendarSignedIn, credentialsError]);

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

      {/* Debugging information - remove in production */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'secondary.light' }}>
        <Typography variant="body2">
          Debug Info: App signed in={!!auth.currentUser}, Calendar signed in={isCalendarSignedIn.toString()}, credentials error={credentialsError.toString()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Redirect URI: {config.redirect_uri} (This must be added to Google Cloud Console)
        </Typography>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSignInClick}
          sx={{ mt: 2 }}
        >
          Emergency Sign-in Button
        </Button>
      </Paper>
      
      {/* Help for redirect_uri_mismatch error */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
        <Typography variant="h6" color="warning.dark" gutterBottom>
          If you see a "redirect_uri_mismatch" error:
        </Typography>
        <Typography variant="body1">
          Follow these steps to fix it:
        </Typography>
        <ol>
          <Typography component="li">Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console Credentials page</a></Typography>
          <Typography component="li">Find and edit your OAuth 2.0 Client ID</Typography>
          <Typography component="li">Add the following URL to the "Authorized redirect URIs" list:</Typography>
          <Typography component="li" sx={{ fontWeight: 'bold' }}>{config.redirect_uri}</Typography>
          <Typography component="li">Save your changes and try again</Typography>
        </ol>
      </Paper>

      {credentialsError ? (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
          <Typography variant="h6" color="error.dark">
            API Credentials Not Configured
          </Typography>
          <Typography variant="body1" paragraph>
            To use the Google Calendar integration, you need to:
          </Typography>
          <ol>
            <Typography component="li">Create a project in the Google Cloud Console</Typography>
            <Typography component="li">Enable the Google Calendar API</Typography>
            <Typography component="li">Create OAuth 2.0 credentials (Client ID and API Key)</Typography>
            <Typography component="li">Add them to your .env file as REACT_APP_GOOGLE_CLIENT_ID and REACT_APP_GOOGLE_API_KEY</Typography>
          </ol>
          <Typography variant="body2">
            For more information, visit the <a href="https://developers.google.com/calendar/api/quickstart/js" target="_blank" rel="noopener noreferrer">Google Calendar API documentation</a>.
          </Typography>
        </Paper>
      ) : (
        <>
          {error && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          )}

          {apiTestStatus && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography color="info.dark">{apiTestStatus}</Typography>
              </Box>
            </Paper>
          )}

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {!isCalendarSignedIn ? (
              /* Sign-in button */
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSignInClick}
                startIcon={<EventIcon />}
                sx={{ 
                  display: 'flex',
                  visibility: 'visible',
                  zIndex: 100,
                  position: 'relative'
                }}
              >
                Sign in to Google Calendar
              </Button>
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setShowAddEventForm(true)}
                    startIcon={<AddIcon />}
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
                  <Button 
                    variant="outlined" 
                    color="info" 
                    onClick={testApiConnection}
                    startIcon={<InfoIcon />}
                    disabled={loading}
                  >
                    Test API
                  </Button>
                </Box>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleSignOutClick}
                >
                  Sign Out
                </Button>
              </>
            )}
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : events.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CalendarIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Upcoming Events
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                You don't have any upcoming events in your calendar.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowAddEventForm(true)}
                startIcon={<AddIcon />}
              >
                Add Your First Event
              </Button>
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
              {events.map((event, index) => (
                <React.Fragment key={event.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => deleteEvent(event.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{ py: 2 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {event.summary}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(event.start.dateTime)} - {formatDate(event.end.dateTime)}
                          </Typography>
                          {event.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                          )}
                          {event.location && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              📍 {event.location}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
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