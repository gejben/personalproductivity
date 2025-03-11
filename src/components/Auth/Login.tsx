import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Container,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

const Login: React.FC = () => {
  const { signIn, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <Container maxWidth="sm" sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          width: '100%',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Personal Productivity Hub
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to access your productivity tools
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            backgroundColor: '#4285F4',
            '&:hover': {
              backgroundColor: '#3367D6'
            },
            width: '100%',
            maxWidth: 300
          }}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        
        <Divider sx={{ width: '100%', my: 3 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          Your data is stored locally and synced with your Google account
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login; 