# Firebase Functions Spotify Configuration

## Environment Variables Setup

The Firebase Functions need access to your Spotify credentials. You need to set these environment variables:

### Option 1: Local Development (.env file)
Create a `.env` file in the `functions/` directory:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### Option 2: Firebase Environment Variables (Production)
Set environment variables in Firebase:
```bash
firebase functions:config:set spotify.client_id="your_spotify_client_id"
firebase functions:config:set spotify.client_secret="your_spotify_client_secret"
```

### Option 3: Firebase Console
1. Go to Firebase Console
2. Select your project
3. Go to Functions > Configuration
4. Add environment variables:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`

## Getting Your Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Copy the Client ID and Client Secret
4. Add them to your environment variables

## Security Notes

- Never commit credentials to version control
- Use environment variables for all sensitive data
- The `.env` file should be in `.gitignore`
- Production should use Firebase environment variables
