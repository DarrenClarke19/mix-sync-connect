import { createClient } from '@supabase/supabase-js'

// Comprehensive debugging
console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
console.log('import.meta.env:', import.meta.env)
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '***exists***' : 'missing')
console.log('All VITE_ variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
console.log('=== END DEBUG ===')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable')
  console.error('Please check your .env file contains: VITE_SUPABASE_URL=https://your-project-ref.supabase.co')
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable')
  console.error('Please check your .env file contains: VITE_SUPABASE_ANON_KEY=your-actual-key')
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

if (supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('❌ Environment variables contain placeholder values. Please update your .env file with real values.')
  throw new Error('Environment variables contain placeholder values. Please update your .env file with real values.')
}

console.log('✅ Environment variables loaded successfully')
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? '***exists***' : 'missing')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  spotify_id?: string
  apple_music_id?: string
  spotify_token?: string
  apple_music_token?: string
  spotify_refresh_token?: string
  token_expires_at?: string
  created_at: string
  updated_at: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  owner_id: string
  is_public: boolean
  cover_url?: string
  created_at: string
  updated_at: string
}

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration_ms?: number
  preview_url?: string
  image_url?: string
  external_urls?: any
  created_at: string
}

export interface PlatformMapping {
  id: string
  song_id: string
  platform: 'spotify' | 'apple_music' | 'youtube'
  platform_id: string
  platform_data?: any
  confidence_score: number
  created_at: string
}

export interface PlaylistSong {
  id: string
  playlist_id: string
  song_id: string
  added_by: string
  position: number
  likes_count: number
  added_at: string
  songs?: Song
  platform_mappings?: PlatformMapping[]
}

export interface PlaylistCollaborator {
  id: string
  playlist_id: string
  user_id: string
  permission_level: 'owner' | 'admin' | 'contributor' | 'viewer'
  joined_at: string
  profiles?: Profile
}

export interface SongLike {
  id: string
  playlist_song_id: string
  user_id: string
  created_at: string
}

export interface PlaylistActivity {
  id: string
  playlist_id: string
  user_id: string
  activity_type: 'song_added' | 'song_removed' | 'song_liked' | 'song_unliked' | 'collaborator_added' | 'playlist_updated'
  activity_data?: any
  created_at: string
}