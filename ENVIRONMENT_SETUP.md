# Environment Configuration Guide

This document provides details on how to set up and manage environment-specific configurations for the Personal Productivity Hub.

## Environment Files

The application uses different environment files for development and production:

- `.env.development` - Used when running locally with `npm start`
- `.env.production` - Used when building for production with `npm run build`

## Setting Up Environment Files

1. Create both files from the template:
   ```
   cp .env.template .env.development
   cp .env.template .env.production
   ```

2. Edit each file with the appropriate credentials:

   ### Development Environment
   For `.env.development`, you should use credentials configured for localhost:
   ```
   REACT_APP_GOOGLE_API_KEY=your_development_api_key
   REACT_APP_GOOGLE_CLIENT_ID=your_development_client_id.apps.googleusercontent.com
   ```

   ### Production Environment
   For `.env.production`, use credentials configured for your production domain:
   ```
   REACT_APP_GOOGLE_API_KEY=your_production_api_key
   REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id.apps.googleusercontent.com
   ```

## Google Cloud Console Configuration

### For Development

1. In your OAuth Client ID settings:
   - Add `http://localhost:3000` to Authorized JavaScript origins
   - Add `http://localhost:3000` to Authorized redirect URIs

2. For API Key:
   - Either leave it unrestricted for development
   - Or restrict it to `localhost` and your local IP

### For Production

1. In your OAuth Client ID settings:
   - Add your production domain (e.g., `https://your-app-name.web.app`) to Authorized JavaScript origins
   - Add your production domain to Authorized redirect URIs

2. For API Key:
   - Always restrict your production API key
   - Add your production domain as an HTTP referrer restriction

## Testing Your Configuration

### Development

1. Start the development server:
   ```
   npm start
   ```

2. Navigate to `http://localhost:3000/calendar`

3. Verify that you can sign in to Google Calendar

### Production

1. Build the application:
   ```
   npm run build
   ```

2. Deploy to your hosting provider:
   ```
   firebase deploy --only hosting
   ```

3. Navigate to your production URL and verify the Calendar integration works

## Troubleshooting

### Environment Variables Not Applied

- React environment variables are embedded during build time
- Whenever you change environment files, you must restart the development server
- Run `npm start` to apply changes in development
- Run `npm run build` to apply changes for production

### Different Behavior Between Environments

If the Calendar integration works in one environment but not another:

1. Check that you've configured the Google Cloud Console correctly for each environment
2. Verify that the API key and client ID are correctly set in each `.env` file
3. Ensure that your production domain is correctly added to authorized origins in Google Cloud Console

### Checking Environment Variables

To debug which environment variables are being used, the Calendar component will log:

```javascript
console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Set (hidden for security)' : 'Not set');
console.log('API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? 'Set (hidden for security)' : 'Not set');
```

Check your browser console to verify the variables are correctly loaded.

## Security Considerations

- **Never commit** your `.env.development` or `.env.production` files to Git
- Ensure your production API key has appropriate restrictions
- Use separate API keys for development and production
- Regularly audit your Google Cloud Console for any security issues 