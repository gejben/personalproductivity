# Google Calendar API 404 Error Troubleshooting

If you're seeing a 404 "Not Found" error like this:

```json
{
  "result": {
    "error": {
      "errors": [
        {
          "domain": "global",
          "reason": "notFound",
          "message": "Not Found"
        }
      ],
      "code": 404,
      "message": "Not Found"
    }
  }
}
```

This indicates that the Google Calendar API couldn't find the resource you're trying to access. Here's how to troubleshoot and fix this issue:

## 1. Verify Google Calendar API is Enabled

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Dashboard"
4. Click on "+ ENABLE APIS AND SERVICES" at the top
5. Search for "Google Calendar API"
6. Make sure it shows as "API Enabled". If not, click on it and then click "ENABLE"

## 2. Check Your OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Make sure you've added the necessary scopes:
   - `https://www.googleapis.com/auth/calendar` (Full access)
   - `https://www.googleapis.com/auth/calendar.readonly` (Read-only access)
3. If you're using an "External" user type, make sure your email is added as a test user

## 3. Verify API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Check that your OAuth Client ID is properly configured:
   - Has the correct authorized JavaScript origins (e.g., `http://localhost:3000`)
   - Has the correct authorized redirect URIs (e.g., `http://localhost:3000`)
3. Check that your API key doesn't have restrictions that might block the API calls

## 4. Modify the Calendar Component's API Configuration

Let's modify the API configuration in the Calendar component to ensure it has the correct scope and discovery docs:

```javascript
// Google Calendar API configuration
const config = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
  scope: "https://www.googleapis.com/auth/calendar",
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ],
};
```

## 5. Try Using a Different Calendar Method

Sometimes the issue is with a specific method. Try modifying the code to use a different method to test if the connection works:

```javascript
// Test if API is accessible by getting the calendar list
const testApiConnection = async () => {
  try {
    const response = await apiCalendar.listCalendars();
    console.log('Calendar list response:', response);
    return true;
  } catch (error) {
    console.error('Error accessing Google Calendar API:', error);
    return false;
  }
};
```

## 6. Check Your Browser Console

The browser console might provide additional information about the error:

1. Open your browser's developer tools (F12 or Right-click > Inspect)
2. Look for any CORS errors or authentication issues
3. Check if there are any specific error messages from the Google API

## 7. Ensure Your Calendar Has Events

If you're trying to list events and seeing a 404 error, it's possible that:
1. You're trying to access a calendar that doesn't exist
2. The calendar exists but has no events in the specified time range
3. The authenticated user doesn't have access to the calendar

Try creating a test event directly in Google Calendar and then fetching events again.

## 8. API Version and Compatibility

Ensure you're using a compatible version of the `react-google-calendar-api` package:

```bash
npm list react-google-calendar-api
```

If you're using an outdated version, try updating it:

```bash
npm install react-google-calendar-api@latest
```

## 9. Testing with Google's APIs Explorer

You can test the Google Calendar API directly using the [APIs Explorer](https://developers.google.com/apis-explorer/#p/calendar/v3/):

1. Go to the APIs Explorer
2. Try making the same request you're making in your code
3. See if you get the same error

## 10. Check Response Headers

The error response shows headers that might provide additional clues:
- Check if there are any rate limiting headers
- Look for any headers indicating authorization issues

If you continue to experience issues after trying these solutions, please provide more specific error details from your console logs. 