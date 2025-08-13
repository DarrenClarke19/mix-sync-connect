-- MixMate Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT,
  apple_music_id TEXT,
  spotify_token TEXT,
  apple_music_token TEXT,
  spotify_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table
CREATE TABLE public.playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist collaborators
CREATE TABLE public.playlist_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'contributor' CHECK (permission_level IN ('owner', 'admin', 'contributor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, user_id)
);

-- Songs table
CREATE TABLE public.songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration_ms INTEGER,
  preview_url TEXT,
  image_url TEXT,
  external_urls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform mappings for cross-platform song matching
CREATE TABLE public.platform_mappings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube')),
  platform_id TEXT NOT NULL,
  platform_data JSONB,
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_id, platform, platform_id)
);

-- Playlist songs (tracks in playlists)
CREATE TABLE public.playlist_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  added_by UUID REFERENCES public.profiles(id),
  position INTEGER NOT NULL,
  likes_count INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Song likes
CREATE TABLE public.song_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_song_id UUID REFERENCES public.playlist_songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_song_id, user_id)
);

-- Activity log for real-time updates
CREATE TABLE public.playlist_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('song_added', 'song_removed', 'song_liked', 'song_unliked', 'collaborator_added', 'playlist_updated')),
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_playlists_owner_id ON public.playlists(owner_id);
CREATE INDEX idx_playlist_collaborators_playlist_id ON public.playlist_collaborators(playlist_id);
CREATE INDEX idx_playlist_collaborators_user_id ON public.playlist_collaborators(user_id);
CREATE INDEX idx_playlist_songs_playlist_id ON public.playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_position ON public.playlist_songs(playlist_id, position);
CREATE INDEX idx_platform_mappings_song_id ON public.platform_mappings(song_id);
CREATE INDEX idx_platform_mappings_platform_id ON public.platform_mappings(platform, platform_id);
CREATE INDEX idx_song_likes_playlist_song_id ON public.song_likes(playlist_song_id);
CREATE INDEX idx_playlist_activity_playlist_id ON public.playlist_activity(playlist_id);

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();