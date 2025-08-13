-- Row Level Security Policies for MixMate
-- Run this in your Supabase SQL editor after creating the tables

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_activity ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Playlists policies
CREATE POLICY "Users can view public playlists and their own playlists" ON public.playlists
  FOR SELECT USING (
    is_public = true OR 
    owner_id = auth.uid() OR 
    id IN (
      SELECT playlist_id FROM public.playlist_collaborators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own playlists" ON public.playlists
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Playlist owners and admins can update playlists" ON public.playlists
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT playlist_id FROM public.playlist_collaborators 
      WHERE user_id = auth.uid() AND permission_level IN ('admin')
    )
  );

CREATE POLICY "Playlist owners can delete playlists" ON public.playlists
  FOR DELETE USING (owner_id = auth.uid());

-- Playlist collaborators policies
CREATE POLICY "Users can view collaborators of playlists they have access to" ON public.playlist_collaborators
  FOR SELECT USING (
    playlist_id IN (
      SELECT id FROM public.playlists 
      WHERE is_public = true OR owner_id = auth.uid() OR
      id IN (
        SELECT playlist_id FROM public.playlist_collaborators 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Playlist owners and admins can manage collaborators" ON public.playlist_collaborators
  FOR ALL USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    ) OR
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators 
      WHERE user_id = auth.uid() AND permission_level IN ('admin')
    )
  );

-- Songs policies (songs are public but managed through platform mappings)
CREATE POLICY "Anyone can view songs" ON public.songs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create songs" ON public.songs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Platform mappings policies
CREATE POLICY "Anyone can view platform mappings" ON public.platform_mappings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create platform mappings" ON public.platform_mappings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Playlist songs policies
CREATE POLICY "Users can view songs in playlists they have access to" ON public.playlist_songs
  FOR SELECT USING (
    playlist_id IN (
      SELECT id FROM public.playlists 
      WHERE is_public = true OR owner_id = auth.uid() OR
      id IN (
        SELECT playlist_id FROM public.playlist_collaborators 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Collaborators can add songs to playlists" ON public.playlist_songs
  FOR INSERT WITH CHECK (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    ) OR
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators 
      WHERE user_id = auth.uid() AND permission_level IN ('owner', 'admin', 'contributor')
    )
  );

CREATE POLICY "Song adders and playlist owners can remove songs" ON public.playlist_songs
  FOR DELETE USING (
    added_by = auth.uid() OR
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    ) OR
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators 
      WHERE user_id = auth.uid() AND permission_level IN ('admin')
    )
  );

-- Song likes policies
CREATE POLICY "Users can view likes on songs they can access" ON public.song_likes
  FOR SELECT USING (
    playlist_song_id IN (
      SELECT id FROM public.playlist_songs
      WHERE playlist_id IN (
        SELECT id FROM public.playlists 
        WHERE is_public = true OR owner_id = auth.uid() OR
        id IN (
          SELECT playlist_id FROM public.playlist_collaborators 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage their own likes" ON public.song_likes
  FOR ALL USING (user_id = auth.uid());

-- Playlist activity policies
CREATE POLICY "Users can view activity for playlists they have access to" ON public.playlist_activity
  FOR SELECT USING (
    playlist_id IN (
      SELECT id FROM public.playlists 
      WHERE is_public = true OR owner_id = auth.uid() OR
      id IN (
        SELECT playlist_id FROM public.playlist_collaborators 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert activity logs" ON public.playlist_activity
  FOR INSERT WITH CHECK (true);

-- Functions to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();