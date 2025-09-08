# API Setup Guide

This guide will help you set up the real API integration for MixMate's unified search.

## 🎵 Spotify API Setup

### 1. Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in:
   - **App name**: MixMate
   - **App description**: Collaborative playlist app
   - **Website**: Your website URL (optional)
   - **Redirect URI**: `http://localhost:3002/spotify/callback` (for development)

### 2. Get Credentials
1. Copy your **Client ID**
2. Copy your **Client Secret** (keep this secure!)

### 3. Set Environment Variables
Add to your `.env` file:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3002/spotify/callback
```

## 🎬 YouTube Data API Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**

### 2. Create API Key
1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. (Optional) Restrict the API key to YouTube Data API v3

### 3. Set Environment Variable
Add to your `.env` file:
```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

## 🔧 Configuration

### 1. Create .env File
Copy `env.example` to `.env` and fill in your API keys:
```bash
cp env.example .env
```

### 2. Update .env with Your Keys
```env
# Spotify
VITE_SPOTIFY_CLIENT_ID=abc123def456ghi789
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3002/spotify/callback

# YouTube
VITE_YOUTUBE_API_KEY=AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr678
```

### 3. Restart Development Server
```bash
npm run dev
```

## 🚀 How It Works

### Search Flow
1. **User searches** → App searches both Spotify and YouTube simultaneously
2. **Results combined** → Songs deduplicated using ISRC codes and fuzzy matching
3. **Best results shown** → Prioritized by relevance and popularity

### Export Flow
1. **User adds songs** → Stored with all platform data (Spotify ID, YouTube ID, etc.)
2. **User exports to Spotify** → Uses exact Spotify IDs for 100% accuracy
3. **Future: Export to Apple Music** → Easy to add when you're ready

### Accurate Matching
- **ISRC Codes**: International Standard Recording Code for exact matching
- **Fuzzy Matching**: Title + artist normalization for approximate matching
- **Source Priority**: Spotify data preferred when available (more accurate)

## 🧪 Testing

### 1. Test Search
- Go to `/search`
- Search for "Bohemian Rhapsody"
- Should show results from both Spotify and YouTube

### 2. Test Export
- Add songs to a playlist
- Connect Spotify
- Export playlist to Spotify
- Should create playlist with exact songs

## 🔒 Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Restrict API keys** in production (IP restrictions, API restrictions)
- **Rotate keys regularly** for security

## 🆘 Troubleshooting

### No Search Results
- Check if API keys are set correctly
- Verify API quotas haven't been exceeded
- Check browser console for errors

### Spotify Export Fails
- Ensure user has connected Spotify
- Check if songs have Spotify data
- Verify Spotify app permissions

### YouTube Search Fails
- Check YouTube API key
- Verify YouTube Data API v3 is enabled
- Check API quotas

## 📊 API Limits

### Spotify
- **Search**: 100 requests per minute per user
- **Playlist creation**: 100 requests per minute per user

### YouTube
- **Search**: 10,000 requests per day (free tier)
- **Video details**: 1,000,000 requests per day (free tier)

## 🎯 Production Deployment

### 1. Update Redirect URIs
```env
VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/spotify/callback
```

### 2. Set Production Environment Variables
- Vercel: Add environment variables in dashboard
- Netlify: Add environment variables in dashboard
- Other platforms: Follow their environment variable setup

### 3. Update Spotify App Settings
- Add production redirect URI in Spotify Developer Dashboard
- Update app settings for production domain
