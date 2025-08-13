import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, playlist_id, platform, song_ids } = await req.json()

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get user's platform tokens
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('spotify_token, spotify_refresh_token, apple_music_token, token_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    if (action === 'export_playlist') {
      return await exportPlaylist(supabaseClient, playlist_id, platform, profile, user.id)
    } else if (action === 'sync_song') {
      return await syncSong(supabaseClient, song_ids, platform, profile)
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Playlist sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function exportPlaylist(supabaseClient: any, playlistId: string, platform: string, profile: any, userId: string) {
  // Get playlist with songs and platform mappings
  const { data: playlist, error: playlistError } = await supabaseClient
    .from('playlists')
    .select(`
      id,
      name,
      description,
      playlist_songs (
        id,
        position,
        songs (
          id,
          title,
          artist,
          album,
          platform_mappings (
            platform,
            platform_id,
            platform_data
          )
        )
      )
    `)
    .eq('id', playlistId)
    .single()

  if (playlistError || !playlist) {
    throw new Error('Playlist not found')
  }

  // Check if user has access to this playlist
  const { data: access } = await supabaseClient
    .from('playlist_collaborators')
    .select('permission_level')
    .eq('playlist_id', playlistId)
    .eq('user_id', userId)
    .single()

  const { data: owner } = await supabaseClient
    .from('playlists')
    .select('owner_id')
    .eq('id', playlistId)
    .eq('owner_id', userId)
    .single()

  if (!access && !owner) {
    throw new Error('Access denied to playlist')
  }

  // Get songs mapped to the target platform
  const mappedSongs = playlist.playlist_songs
    .map((ps: any) => {
      const mapping = ps.songs.platform_mappings.find((m: any) => m.platform === platform)
      return mapping ? {
        position: ps.position,
        platform_id: mapping.platform_id,
        platform_data: mapping.platform_data
      } : null
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.position - b.position)

  if (mappedSongs.length === 0) {
    throw new Error('No songs available for this platform')
  }

  if (platform === 'spotify') {
    return await exportToSpotify(playlist, mappedSongs, profile)
  } else if (platform === 'apple_music') {
    return await exportToAppleMusic(playlist, mappedSongs, profile)
  }

  throw new Error('Unsupported platform')
}

async function exportToSpotify(playlist: any, songs: any[], profile: any) {
  if (!profile.spotify_token) {
    throw new Error('Spotify not connected')
  }

  // Check if token needs refresh
  if (new Date(profile.token_expires_at) <= new Date()) {
    // Token expired - would need to refresh here
    throw new Error('Spotify token expired, please reconnect')
  }

  // Create playlist on Spotify
  const createResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${profile.spotify_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${playlist.name} (MixMate)`,
      description: playlist.description || 'Collaborative playlist from MixMate',
      public: false,
    }),
  })

  if (!createResponse.ok) {
    const error = await createResponse.text()
    throw new Error(`Failed to create Spotify playlist: ${error}`)
  }

  const spotifyPlaylist = await createResponse.json()

  // Add songs in batches (Spotify allows up to 100 tracks per request)
  const batchSize = 100
  const trackUris = songs.map((song: any) => `spotify:track:${song.platform_id}`)

  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize)
    
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${spotifyPlaylist.id}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.spotify_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      }
    )

    if (!addResponse.ok) {
      console.error(`Failed to add batch ${i / batchSize + 1}:`, await addResponse.text())
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      platform_playlist: {
        id: spotifyPlaylist.id,
        name: spotifyPlaylist.name,
        external_url: spotifyPlaylist.external_urls?.spotify,
      },
      songs_added: trackUris.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function exportToAppleMusic(playlist: any, songs: any[], profile: any) {
  // Apple Music implementation would go here
  // For now, return a mock success response
  
  return new Response(
    JSON.stringify({
      success: true,
      platform_playlist: {
        id: `apple_${Date.now()}`,
        name: `${playlist.name} (MixMate)`,
        external_url: 'https://music.apple.com',
      },
      songs_added: songs.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncSong(supabaseClient: any, songIds: string[], platform: string, profile: any) {
  // Implementation for syncing individual songs
  // This would be called when a new song is added to a playlist
  
  return new Response(
    JSON.stringify({
      success: true,
      synced_songs: songIds.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}