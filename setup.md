# MixMate Setup Guide 🚀

This guide will walk you through setting up MixMate from scratch, including all the necessary configurations for Spotify integration and Supabase backend.

## 📋 Prerequisites

- **Node.js 18+** and npm/yarn/bun
- **Git** for version control
- **Supabase account** (free tier works)
- **Spotify Developer account** (free)
- **Code editor** (VS Code recommended)

## 🎯 Step-by-Step Setup

### 1. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd mix-sync-connect

# Install dependencies
npm install
# or
yarn install
# or
bun install
```

### 2. Supabase Setup

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `mixmate` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for setup to complete (2-3 minutes)

#### 2.2 Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

#### 2.3 Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the entire contents of `database_schema.sql`
4. Click "Run" to execute the schema

#### 2.4 Set Up RLS Policies

1. In the SQL Editor, create another query
2. Copy and paste the entire contents of `rls_policies.sql`
3. Click "Run" to set up security policies

### 3. Spotify Integration Setup

#### 3.1 Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the details:
   - **App name**: `MixMate` (or your preferred name)
   - **App description**: `Collaborative playlist app`
   - **Website**: `http://localhost:5173` (for development)
   - **Redirect URIs**: `http://localhost:5173/auth/callback`
   - **API/SDKs**: Check "Web API"
4. Click "Save"
5. Copy your **Client ID**

#### 3.2 Configure Spotify App

1. In your Spotify app settings, add these scopes:
   - `playlist-read-private`
   - `playlist-modify-private`
   - `playlist-modify-public`
   - `user-read-private`
   - `user-read-email`

### 4. Environment Configuration

#### 4.1 Create Environment File

1. In your project root, create a `.env` file
2. Add your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Spotify Configuration
VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/callback

# Optional: Apple Music (for future implementation)
VITE_APPLE_MUSIC_TEAM_ID=your-team-id
VITE_APPLE_MUSIC_KEY_ID=your-key-id
VITE_APPLE_MUSIC_PRIVATE_KEY=your-private-key

# Optional: OpenAI (for enhanced song matching)
VITE_OPENAI_API_KEY=your-openai-key
```

#### 4.2 Set Supabase Secrets

1. In your Supabase dashboard, go to **Settings** → **Edge Functions**
2. Add these secrets:

```bash
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/callback
```

**Note**: You'll need to get the Spotify Client Secret from your Spotify app settings.

### 5. Deploy Supabase Functions

#### 5.1 Install Supabase CLI

```bash
npm install -g supabase
# or
yarn global add supabase
```

#### 5.2 Login and Link Project

```bash
# Login to Supabase
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref your-project-ref
```

#### 5.3 Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy spotify-auth
supabase functions deploy song-matching
supabase functions deploy playlist-sync
```

### 6. Test the Setup

#### 6.1 Start Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

#### 6.2 Test Authentication

1. Visit `http://localhost:5173`
2. Click "Get Started with MixMate"
3. Try to sign up with an email
4. Verify email (check your inbox)
5. Sign in

#### 6.3 Test Spotify Connection

1. After signing in, click "Connect Platform"
2. Click "Connect Spotify"
3. Complete OAuth flow
4. Verify connection success

## 🔧 Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables"
- Check your `.env` file exists and has correct values
- Restart your dev server after changing `.env`

#### 2. "Spotify client ID not configured"
- Verify `VITE_SPOTIFY_CLIENT_ID` in your `.env`
- Check Spotify app settings

#### 3. "Database connection failed"
- Verify Supabase URL and anon key
- Check if database schema was created successfully

#### 4. "Function deployment failed"
- Ensure you're logged into Supabase CLI
- Check your project is linked correctly
- Verify function code syntax

#### 5. "OAuth redirect URI mismatch"
- Ensure redirect URI in Spotify app matches exactly
- Check for trailing slashes or typos

### Debug Steps

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for failed API calls
3. **Check Supabase Logs** in dashboard
4. **Verify Environment Variables** are loaded correctly

## 🚀 Next Steps

Once basic setup is working:

1. **Test Playlist Creation**: Create a playlist and add songs
2. **Test Song Search**: Search for songs on Spotify
3. **Test Export**: Export playlist to Spotify
4. **Add Collaborators**: Invite friends to playlists
5. **Deploy to Production**: Set up hosting and production environment

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🆘 Need Help?

- Check the [main README.md](README.md) for more details
- Open an issue on GitHub
- Check Supabase community forums
- Review Spotify developer community

---

**Happy coding! 🎵✨**
