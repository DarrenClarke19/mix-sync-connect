import { useState, useEffect } from 'react'
import { supabase, Playlist, PlaylistSong, PlaylistCollaborator } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface PlaylistWithDetails extends Playlist {
  playlist_songs: PlaylistSong[]
  playlist_collaborators: PlaylistCollaborator[]
  owner?: { display_name: string; username: string }
}

export function usePlaylist(playlistId?: string) {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<PlaylistWithDetails[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch user's playlists
  const fetchPlaylists = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_songs (
            id,
            position,
            likes_count,
            songs (
              id,
              title,
              artist,
              album,
              image_url
            )
          ),
          playlist_collaborators (
            id,
            permission_level,
            profiles (
              display_name,
              username,
              avatar_url
            )
          )
        `)
        .or(`owner_id.eq.${user.id},playlist_collaborators.user_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setPlaylists(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch specific playlist
  const fetchPlaylist = async (id: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_songs (
            id,
            position,
            likes_count,
            added_by,
            added_at,
            songs (
              id,
              title,
              artist,
              album,
              image_url,
              platform_mappings (
                platform,
                platform_id,
                platform_data
              )
            )
          ),
          playlist_collaborators (
            id,
            permission_level,
            profiles (
              id,
              display_name,
              username,
              avatar_url
            )
          ),
          profiles:owner_id (
            display_name,
            username
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setCurrentPlaylist(data)
      return data
    } catch (err) {
      setError(err as Error)
      return null
    }
  }

  // Create new playlist
  const createPlaylist = async (name: string, description?: string) => {
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Add owner as collaborator
      await supabase
        .from('playlist_collaborators')
        .insert({
          playlist_id: data.id,
          user_id: user.id,
          permission_level: 'owner',
        })

      await fetchPlaylists()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  // Add song to playlist
  const addSong = async (
    playlistId: string, 
    songData: {
      title: string
      artist: string
      album?: string
      platform: string
      platform_id: string
      platform_data?: any
    }
  ) => {
    if (!user) throw new Error('Not authenticated')

    try {
      // First, create or find the song
      let { data: existingSong } = await supabase
        .from('songs')
        .select('id')
        .eq('title', songData.title)
        .eq('artist', songData.artist)
        .single()

      let songId = existingSong?.id

      if (!songId) {
        const { data: newSong, error: songError } = await supabase
          .from('songs')
          .insert({
            title: songData.title,
            artist: songData.artist,
            album: songData.album,
          })
          .select()
          .single()

        if (songError) throw songError
        songId = newSong.id
      }

      // Create platform mapping
      await supabase
        .from('platform_mappings')
        .upsert({
          song_id: songId,
          platform: songData.platform,
          platform_id: songData.platform_id,
          platform_data: songData.platform_data,
        }, {
          onConflict: 'song_id,platform,platform_id'
        })

      // Get next position in playlist
      const { data: lastSong } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      const nextPosition = (lastSong?.position || 0) + 1

      // Add song to playlist
      const { data, error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          added_by: user.id,
          position: nextPosition,
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase
        .from('playlist_activity')
        .insert({
          playlist_id: playlistId,
          user_id: user.id,
          activity_type: 'song_added',
          activity_data: { song_title: songData.title, song_artist: songData.artist },
        })

      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  // Remove song from playlist
  const removeSong = async (playlistSongId: string) => {
    if (!user) throw new Error('Not authenticated')

    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('id', playlistSongId)

      if (error) throw error
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  // Like/unlike song
  const toggleLike = async (playlistSongId: string) => {
    if (!user) throw new Error('Not authenticated')

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('song_likes')
        .select('id')
        .eq('playlist_song_id', playlistSongId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('song_likes')
          .delete()
          .eq('id', existingLike.id)
      } else {
        // Like
        await supabase
          .from('song_likes')
          .insert({
            playlist_song_id: playlistSongId,
            user_id: user.id,
          })
      }

      return !existingLike
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('playlist_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_songs',
        },
        () => {
          // Refresh current playlist when songs change
          if (currentPlaylist) {
            fetchPlaylist(currentPlaylist.id)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, currentPlaylist?.id])

  useEffect(() => {
    if (user) {
      fetchPlaylists()
    }
  }, [user])

  useEffect(() => {
    if (playlistId && user) {
      fetchPlaylist(playlistId)
    }
  }, [playlistId, user])

  return {
    playlists,
    currentPlaylist,
    loading,
    error,
    createPlaylist,
    addSong,
    removeSong,
    toggleLike,
    fetchPlaylist,
    refetch: fetchPlaylists,
  }
}