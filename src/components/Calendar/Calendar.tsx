import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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

// Add type declarations for gapi
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Google Calendar API configuration
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Check if API credentials are set
const areCredentialsSet = 
  process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'YOUR_CLIENT_ID' && 
  process.env.REACT_APP_GOOGLE_API_KEY !== 'YOUR_API_KEY' &&
  process.env.REACT_APP_GOOGLE_CLIENT_ID !== '' &&
  process.env.REACT_APP_GOOGLE_API_KEY !== '';

// Token storage key
const TOKEN_KEY = 'google_calendar_token';

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
  const [gapiInited, setGapiInited] = useState<boolean>(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  // Form state for adding events
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    startDateTime: new Date(),
    endDateTime: new Date(new Date().getTime() + 60 * 60 * 1000),
  });

  // Check if token exists and is valid
  const checkToken = useCallback(async () => {
    try {
      const token = window.gapi?.client?.getToken();
      if (token) {
        // Verify token is still valid
        const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token.access_token);
        const data = await response.json();
        
        if (!data.error) {
          setIsCalendarSignedIn(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  }, []);

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async () => {
    if (!isCalendarSignedIn || !window.gapi?.client?.calendar) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      setEvents(response.result.items || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      if (error.status === 401) {
        setError('Session expired. Please sign in again.');
        setIsCalendarSignedIn(false);
      } else {
        setError(error.message || 'Failed to fetch events');
      }
    } finally {
      setLoading(false);
    }
  }, [isCalendarSignedIn]);

  // Handle token response
  const handleTokenResponse = useCallback((response: any) => {
    if (response.error) {
      setError(`Authentication failed: ${response.error}`);
      setIsCalendarSignedIn(false);
    } else {
      setIsCalendarSignedIn(true);
      fetchEvents();
    }
    setLoading(false);
  }, [fetchEvents]);

  // Initialize the Google API client
  const initializeGapiClient = useCallback(async () => {
    if (!window.gapi) return;
    
    try {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      setGapiInited(true);
      
      // Check if we have a valid token
      const hasValidToken = await checkToken();
      if (hasValidToken) {
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
      setError('Failed to initialize Google Calendar. Please try again.');
    }
  }, [checkToken, fetchEvents]);

  // Load the Google API client library
  useEffect(() => {
    // Check if GAPI is already loaded
    if (window.gapi?.client) {
      setGapiInited(true);
      checkToken();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', initializeGapiClient);
    };
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [initializeGapiClient, checkToken]);

  // Load the Google Identity Services library
  useEffect(() => {
    // Check if Google Identity Services is already loaded
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
        prompt: 'consent',
        ux_mode: 'redirect',
        access_type: 'offline',
        include_granted_scopes: true
      });
      setTokenClient(client);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
        prompt: 'consent',
        ux_mode: 'redirect',
        access_type: 'offline',
        include_granted_scopes: true
      });
      setTokenClient(client);
    };
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [handleTokenResponse]);

  // Handle Google Calendar sign-in
  const handleSignInClick = () => {
    setError(null);
    setLoading(true);
    
    if (!areCredentialsSet) {
      setError('Google Calendar API credentials are not properly configured.');
      setLoading(false);
      return;
    }

    if (!gapiInited || !tokenClient) {
      setError('Google Calendar API is not initialized. Please try again in a moment.');
      setLoading(false);
      return;
    }

    // Request an access token and trigger the popup
    try {
      tokenClient.requestAccessToken();  // Remove prompt option to use default from initialization
    } catch (error) {
      console.error('Error requesting access token:', error);
      setError('Failed to open authentication popup. Please allow popups for this site.');
      setLoading(false);
    }
  };

  // Handle Google Calendar sign-out
  const handleSignOutClick = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    setIsCalendarSignedIn(false);
    setEvents([]);
  };

  // Add event to Google Calendar
  const addEvent = async () => {
    if (!isCalendarSignedIn || !window.gapi?.client?.calendar) return;
    
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
      await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      setShowAddEventForm(false);
      resetFormData();
      fetchEvents();
    } catch (error: any) {
      console.error('Error adding event:', error);
      setError(error.message || 'Failed to add event');
      setLoading(false);
    }
  };

  // Delete event from Google Calendar
  const deleteEvent = async (eventId: string) => {
    if (!isCalendarSignedIn || !window.gapi?.client?.calendar) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError(error.message || 'Failed to delete event');
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
            disabled={!gapiInited || !tokenClient}
          >
            Sign in to Google Calendar
          </Button>
        </Box>
      ) : (
        <Box component="div">
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
            <Box component="div" sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
              <Typography component="div" variant="h6" color="text.secondary">
                No events found
              </Typography>
              <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Event" to create your first event
              </Typography>
            </Box>
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
                    <Box sx={{ flex: 1 }}>
                      <Typography component="div" variant="body1">
                        {event.summary}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" variant="body2" color="text.primary">
                            {formatDate(event.start.dateTime)}
                          </Typography>
                          {event.location && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              • {event.location}
                            </Typography>
                          )}
                        </Box>
                        {event.description && (
                          <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {event.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}

      {renderAddEventForm()}
    </Box>
  );
};

export default Calendar; 