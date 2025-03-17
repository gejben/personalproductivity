# Troubleshooting Google Calendar Integration

If you're experiencing issues with the Google Calendar integration, follow these steps to diagnose and fix the problems.

## Common Errors

### 404 Errors in Console

If you see errors like:
```
Failed to load resource: the server responded with a status of 404 ()
Error fetching events: object overrideMethod
```

This typically indicates an issue with your Google Calendar API configuration.

### 401 Unauthorized: "API keys are not supported by this API"

If you see errors like:
```
"API keys are not supported by this API. Expected OAuth2 access token or other authentication credentials that assert a principal."
```

This is because Google Calendar API requires OAuth2 authentication with appropriate scopes, not just an API key. You need to:

1. Make sure you're using handleAuthClick() to properly authenticate users
2. Verify your OAuth consent screen is configured properly with the right scopes
3. Check that you're using the correct client ID in your .env file

**Important:** The Google Calendar API specifically requires OAuth2 for most operations. An API key alone is not sufficient. The API key is used for simple requests that don't require user authentication, while OAuth2 is used for accessing user-specific data.

### 401 Unauthorized on calendar/users/me/calendarList endpoint

If you see errors like:
```
GET https://content.googleapis.com/calendar/v3/users/me/calendarList?key=YOUR_API_KEY 401 (Unauthorized)
```

This specific endpoint requires a valid OAuth2 token and cannot be accessed with just an API key. To fix this:

1. Make sure your OAuth flow is properly configured in Google Cloud Console:
   - Ensure your app is properly configured for the OAuth consent screen
   - Verify that your Client ID is for a "Web application" type
   - Confirm that http://localhost:3000 is in both authorized origins and redirect URIs

2. Try changing from popup to redirect mode in your ApiCalendar configuration:
   ```javascript
   const config = {
     // Other settings...
     ux_mode: 'redirect' // Change from 'popup' to 'redirect'
   };
   ```

3. Ensure the user has successfully completed the OAuth flow by checking for visible sign-in prompts and consent screens. If you don't see these, the authentication flow may be failing silently.

## Step-by-Step Troubleshooting

### 1. Verify API Credentials

1. Check that your `.env` file contains the correct credentials:
   ```
   REACT_APP_GOOGLE_API_KEY=your_actual_api_key
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   ```

2. Make sure there are no spaces or quotes around the values.

3. Restart the development server after making changes to the `.env` file.

### 2. Google Cloud Console Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Select your project

3. Navigate to "APIs & Services" > "Dashboard"

4. Verify that the Google Calendar API is enabled:
   - If not, click "ENABLE APIS AND SERVICES" and search for "Google Calendar API"
   - Click on it and press "ENABLE"

5. Check your OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Make sure you've configured the consent screen
   - **Make sure these specific scopes are added:**
     - `https://www.googleapis.com/auth/calendar` (Full access)
     - `https://www.googleapis.com/auth/calendar.readonly` (Read-only access)
     - `https://www.googleapis.com/auth/calendar.events` (Manage events)
   - Add your email as a test user if you're using an external user type

6. Verify your credentials:
   - Go to "APIs & Services" > "Credentials"
   - Check your API key:
     - Make sure it's not restricted, or if it is, ensure localhost:3000 is in the allowed referrers
   - Check your OAuth Client ID:
     - Make sure it's a "Web application" type
     - Ensure http://localhost:3000 is in the Authorized JavaScript origins
     - Ensure http://localhost:3000 is in the Authorized redirect URIs
     - **Copy the exact Client ID** and make sure it's properly set in your .env file

### 3. OAuth Authentication Issues

If you're still seeing "API keys are not supported" or similar authentication errors:

1. Check that your OAuth flow is working properly:
   - When clicking "Sign in to Google Calendar", you should see a Google sign-in popup
   - You should be asked to grant permission to access your calendar
   - If this isn't happening, check your browser's popup blocker settings

2. Clear your browser's cache and cookies:
   - This can help if there are stale authentication tokens

3. Try signing out of all Google accounts in your browser, then:
   - Sign into only one Google account
   - Try the calendar integration again

4. Check your browser console for specific error messages:
   - Look for errors related to "gapi" or "OAuth"
   - Check if there are any CORS errors

5. If you're in development mode:
   - Make sure to use http://localhost:3000 as both the JavaScript origin and redirect URI
   - Don't use https:// unless you have SSL set up for local development

### 4. Browser Issues

1. Clear your browser cache and cookies

2. Try using an incognito/private browsing window

3. Check if you're logged into multiple Google accounts - this can sometimes cause authentication issues

### 5. Code Debugging

If you're still experiencing issues, you can add more detailed logging:

1. Open `src/components/Calendar/Calendar.tsx`

2. Add more console logs in the error handling sections:
   ```javascript
   .catch((error) => {
     console.error('Error details:', error);
     console.error('Error response:', error.response);
     setError('Failed to sign in to Google Calendar. Please try again.');
   });
   ```

3. Check the browser console for more detailed error information

### 6. API Quotas and Restrictions

1. Check if you've exceeded your API quota:
   - Go to Google Cloud Console > APIs & Services > Dashboard
   - Look for any quota warnings

2. Verify your API key doesn't have any restrictions that would block your requests

## Database Seeding Issues

### Import Error with TypeScript Files

**Problem:** When running the seed script, you get an error about importing from TypeScript files.

**Solution:** 
Option 1: Ensure you've compiled the TypeScript files first:

```
npx tsc --allowJs --skipLibCheck --jsx react src/firebase/seedDefaultCategories.ts --outDir lib
```

Then run the seed script:

```
npm run seed
```

Option 2: Use the direct TypeScript execution scripts:

```
npm run seed:direct
```

or for resetting:

```
npm run seed:reset:direct
```

These scripts use ts-node to execute the TypeScript file directly without compilation.

### Firebase Connection Issues

**Problem:** The seed script fails with Firebase connection errors.

**Solution:**
1. Ensure your Firebase credentials are correctly set in your `.env` files
2. Check that you have the correct permissions in your Firebase project
3. Verify that the Firestore database is properly initialized
4. Make sure your IP address is not blocked by Firebase security rules

### "defaultCategories" Collection Already Exists

**Problem:** The script reports that categories already exist and skips seeding.

**Solution:** If you want to reset the categories, use the reset script:

```
npm run seed:reset
```

This will delete all existing default categories and recreate them.

## Still Having Issues?

If you're still experiencing problems after following these steps:

1. Try creating a new project in Google Cloud Console
2. Set up new credentials
3. Update your `.env` file with the new credentials
4. Restart the development server

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 for JavaScript](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Google API Key Best Practices](https://developers.google.com/maps/api-security-best-practices) 