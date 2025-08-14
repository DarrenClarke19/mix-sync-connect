# MixMate 🎵

**Collaborative, cross-platform playlist app for friends**

MixMate allows friends to create and curate playlists together, regardless of whether they use Spotify, Apple Music, or other major streaming services. Users can add songs, vote on tracks, and export playlists to their preferred music platform—all in a simple, mobile-first experience.

## ✨ Features

- **Cross-Platform Collaboration**: Connect Spotify, Apple Music, and more
- **Real-Time Sync**: Changes appear instantly across all collaborators
- **AI-Powered Song Matching**: Smart mapping of songs across platforms
- **One-Click Export**: Push collaborative playlists to your connected service
- **Social Features**: Track who added songs, like/dislike tracks
- **Modern UI**: Beautiful, responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Supabase account
- Spotify Developer account (for Spotify integration)
- Apple Developer account (for Apple Music integration - optional)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd mix-sync-connect
npm install
# or
yarn install
# or
bun install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the database schema:

```sql
-- Copy and paste the contents of database_schema.sql into your Supabase SQL editor
```

4. Set up Row Level Security (RLS) policies:

```sql
-- Copy and paste the contents of rls_policies.sql into your Supabase SQL editor
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Spotify API Configuration
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/callback

# Apple Music Configuration (optional)
VITE_APPLE_MUSIC_TEAM_ID=your_apple_team_id
VITE_APPLE_MUSIC_KEY_ID=your_apple_key_id
VITE_APPLE_MUSIC_PRIVATE_KEY=your_apple_private_key

# OpenAI Configuration (for enhanced song matching)
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 4. Set up Spotify Integration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:5173/auth/callback` to Redirect URIs
4. Copy Client ID to your `.env` file

### 5. Deploy Supabase Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy
```

### 6. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

Visit `http://localhost:5173` to see your app!

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **Supabase** for database and authentication
- **Edge Functions** for platform integrations
- **Real-time subscriptions** for live updates

### Database Schema
- **Users**: Extended Supabase auth with platform tokens
- **Playlists**: Collaborative playlist management
- **Songs**: Cross-platform song metadata
- **Platform Mappings**: AI-powered song matching
- **Collaborators**: User permissions and access control

## 🔧 Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── SongSearch.tsx  # Song search and addition
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state
│   └── ...
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Helper functions
├── pages/              # Page components
└── main.tsx           # App entry point

supabase/
├── functions/          # Edge functions
│   ├── spotify-auth/   # Spotify OAuth handling
│   ├── song-matching/  # Cross-platform song matching
│   └── playlist-sync/  # Playlist export/sync
└── ...
```

### Key Components

- **SongSearch**: Search and add songs from connected platforms
- **PlatformConnectModal**: Connect music streaming accounts
- **PlaylistView**: Collaborative playlist management
- **AuthModal**: User authentication

### Adding New Features

1. **New Platform**: Add to `PlatformConnectModal` and create corresponding edge function
2. **New UI Component**: Create in `src/components/` following shadcn/ui patterns
3. **Database Changes**: Update `database_schema.sql` and redeploy

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Netlify

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **OAuth 2.0** for platform authentication
- **JWT tokens** for user sessions
- **Environment variables** for sensitive data
- **CORS** configured for edge functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Vite](https://vitejs.dev) for the fast build tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/mix-sync-connect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/mix-sync-connect/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ for music lovers everywhere**
