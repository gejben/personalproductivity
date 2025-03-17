# Personal Productivity Hub

A comprehensive productivity application that integrates various tools to help you stay organized and productive.

## Features

- **Todo List**: Manage your tasks and track their completion status
- **Notes**: Create and organize your notes
- **Pomodoro Timer**: Stay focused with the Pomodoro technique
- **Habits Tracker**: Build and maintain good habits
- **Google Calendar Integration**: Connect with your Google Calendar to manage events

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Cloud account (for Calendar integration)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/personal-productivity-hub.git
   cd personal-productivity-hub
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment files:
   - Copy `.env.template` to `.env.development` for local development
   - Copy `.env.template` to `.env.production` for production builds
   - Fill in your Google Calendar API credentials in both files

   ```
   # For development (used with npm start)
   cp .env.template .env.development
   
   # For production (used with npm run build)
   cp .env.template .env.production
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Setting up Google Calendar API

To use the Google Calendar integration, you need to set up API credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials:
   - Create an OAuth client ID
   - Configure the OAuth consent screen
   - Set the application type as "Web application"
   - Add your domain to the authorized JavaScript origins:
     - For development: `http://localhost:3000`
     - For production: Your actual domain (e.g., `https://your-app-name.web.app`)
   - Add your redirect URIs:
     - For development: `http://localhost:3000`
     - For production: Your actual domain (e.g., `https://your-app-name.web.app`)
5. Create an API Key
6. Add the Client ID and API Key to your environment files:
   - `.env.development` for local development
   - `.env.production` for production deployment

## Usage

### Todo List

- Add new tasks using the input field
- Mark tasks as complete by checking the checkbox
- Delete tasks you no longer need

### Notes

- Create new notes with the "New Note" button
- Select notes from the sidebar to view and edit
- Edit the title and content of your notes
- Delete notes you no longer need

### Habits Tracker

- Create new habits to track
- Mark daily completions of your habits
- View your progress and streaks

### Pomodoro Timer

- Choose between Work, Short Break, and Long Break modes
- Start, pause, and reset the timer
- Track your completed work cycles

### Google Calendar

- Sign in to your Google account
- View upcoming events
- Add new events directly from the app
- Delete events as needed

## Building for Production

```
npm run build
```

This will use the variables from `.env.production` for the build.

## Deployment

The application can be deployed to Firebase or any other hosting service.

```
firebase deploy --only hosting
```

## Data Storage

- User authentication data is stored in Firebase Authentication
- User data (todos, notes, habits) is stored in Firestore
- Calendar events are stored in Google Calendar

## Database Seeding

The application includes scripts for seeding default data into the database:

### Default Habit Categories

To seed default habit categories into your Firestore database:

```
npm run seed
```

This will add default categories like Health, Fitness, Learning, Productivity, etc., if they don't already exist.

To reset and recreate all default categories (warning: this will delete existing default categories):

```
npm run seed:reset
```

If you encounter issues with the main scripts, you can try the direct TypeScript execution:

```
npm run seed:direct
```

or for resetting:

```
npm run seed:reset:direct
```

Note: You must have Firebase configured properly before running these scripts.

## Technologies Used

- React
- TypeScript
- Material-UI
- Firebase (Authentication & Firestore)
- Google Calendar API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by productivity techniques and tools like Pomodoro, Todoist, and Evernote
- Built with React and TypeScript for a robust and type-safe application
