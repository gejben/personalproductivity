import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { signIn, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    <div className="login-container">
      <div className="login-card">
        <h1>Personal Productivity Hub</h1>
        <p className="login-subtitle">Sign in to access your productivity tools</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <button 
          className="google-signin-button" 
          onClick={handleGoogleSignIn}
          disabled={loading}
          aria-label="Sign in with Google"
        >
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google logo" 
            className="google-logo"
          />
          <span>
            {loading ? (
              <>
                <div className="login-spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign in with Google'
            )}
          </span>
        </button>
        
        <div className="login-info">
          <p>Your data is stored locally and synced with your Google account</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 