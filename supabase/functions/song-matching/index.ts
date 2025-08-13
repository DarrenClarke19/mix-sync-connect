import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SongData {
  title: string
  artist: string
  album?: string
  platform: string
  platform_id: string
  platform_data?: any
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

    const { song_data, target_platform } = await req.json() as {
      song_data: SongData
      target_platform: 'spotify' | 'apple_music'
    }

    // First, check if we already have this song and its mappings
    const { data: existingSongs } = await supabaseClient
      .from('songs')
      .select(`
        id,
        platform_mappings (
          platform,
          platform_id,
          platform_data,
          confidence_score
        )
      `)
      .ilike('title', song_data.title)
      .ilike('artist', song_data.artist)
      .limit(10)

    // Check if we already have a mapping for the target platform
    if (existingSongs && existingSongs.length > 0) {
      for (const song of existingSongs) {
        const mapping = song.platform_mappings?.find(
          (m: any) => m.platform === target_platform
        )
        if (mapping) {
          return new Response(
            JSON.stringify({
              success: true,
              song_id: song.id,
              mapping: mapping,
              source: 'cache'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // If no cached mapping, search the target platform
    let searchResult = null

    if (target_platform === 'spotify') {
      searchResult = await searchSpotify(song_data)
    } else if (target_platform === 'apple_music') {
      searchResult = await searchAppleMusic(song_data)
    }

    if (!searchResult) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No match found on target platform'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or update song and mapping
    let songId = existingSongs?.[0]?.id

    if (!songId) {
      // Create new song
      const { data: newSong, error: songError } = await supabaseClient
        .from('songs')
        .insert({
          title: song_data.title,
          artist: song_data.artist,
          album: song_data.album,
          duration_ms: searchResult.duration_ms,
          preview_url: searchResult.preview_url,
          image_url: searchResult.image_url,
          external_urls: searchResult.external_urls,
        })
        .select()
        .single()

      if (songError) {
        throw new Error('Failed to create song: ' + songError.message)
      }

      songId = newSong.id
    }

    // Create platform mappings for both source and target
    const mappings = [
      {
        song_id: songId,
        platform: song_data.platform,
        platform_id: song_data.platform_id,
        platform_data: song_data.platform_data,
        confidence_score: 1.0,
      },
      {
        song_id: songId,
        platform: target_platform,
        platform_id: searchResult.platform_id,
        platform_data: searchResult.platform_data,
        confidence_score: searchResult.confidence_score,
      }
    ]

    const { error: mappingError } = await supabaseClient
      .from('platform_mappings')
      .upsert(mappings, { 
        onConflict: 'song_id,platform,platform_id',
        ignoreDuplicates: false 
      })

    if (mappingError) {
      console.error('Mapping error:', mappingError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        song_id: songId,
        mapping: {
          platform: target_platform,
          platform_id: searchResult.platform_id,
          platform_data: searchResult.platform_data,
          confidence_score: searchResult.confidence_score,
        },
        source: 'new_search'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Song matching error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function searchSpotify(songData: SongData) {
  const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

  if (!spotifyClientId || !spotifyClientSecret) {
    throw new Error('Missing Spotify credentials')
  }

  // Get client credentials token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Spotify token')
  }

  const tokenData = await tokenResponse.json()

  // Search for the song
  const query = encodeURIComponent(`track:"${songData.title}" artist:"${songData.artist}"`)
  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    }
  )

  if (!searchResponse.ok) {
    throw new Error('Spotify search failed')
  }

  const searchData = await searchResponse.json()
  
  if (!searchData.tracks?.items?.length) {
    return null
  }

  // Find best match using fuzzy matching
  const bestMatch = findBestMatch(songData, searchData.tracks.items, 'spotify')
  
  if (!bestMatch) {
    return null
  }

  return {
    platform_id: bestMatch.id,
    platform_data: bestMatch,
    duration_ms: bestMatch.duration_ms,
    preview_url: bestMatch.preview_url,
    image_url: bestMatch.album?.images?.[0]?.url,
    external_urls: bestMatch.external_urls,
    confidence_score: calculateConfidence(songData, bestMatch, 'spotify'),
  }
}

async function searchAppleMusic(songData: SongData) {
  // Apple Music requires JWT token - simplified for demo
  // In production, you'd implement proper Apple Music API authentication
  
  // For now, return a mock result to demonstrate the structure
  return {
    platform_id: `apple_${Date.now()}`,
    platform_data: {
      id: `apple_${Date.now()}`,
      attributes: {
        name: songData.title,
        artistName: songData.artist,
        albumName: songData.album,
      }
    },
    duration_ms: 180000, // 3 minutes default
    preview_url: null,
    image_url: null,
    external_urls: {},
    confidence_score: 0.85,
  }
}

function findBestMatch(originalSong: SongData, candidates: any[], platform: string) {
  let bestMatch = null
  let highestScore = 0

  for (const candidate of candidates) {
    const score = calculateConfidence(originalSong, candidate, platform)
    if (score > highestScore && score > 0.7) { // Minimum confidence threshold
      highestScore = score
      bestMatch = candidate
    }
  }

  return bestMatch
}

function calculateConfidence(original: SongData, candidate: any, platform: string): number {
  let score = 0

  // Title similarity (40% weight)
  const titleSimilarity = stringSimilarity(
    original.title.toLowerCase(),
    (platform === 'spotify' ? candidate.name : candidate.attributes?.name || '').toLowerCase()
  )
  score += titleSimilarity * 0.4

  // Artist similarity (40% weight)
  const candidateArtist = platform === 'spotify' 
    ? candidate.artists?.[0]?.name || ''
    : candidate.attributes?.artistName || ''
  
  const artistSimilarity = stringSimilarity(
    original.artist.toLowerCase(),
    candidateArtist.toLowerCase()
  )
  score += artistSimilarity * 0.4

  // Album similarity (20% weight) - optional
  if (original.album) {
    const candidateAlbum = platform === 'spotify'
      ? candidate.album?.name || ''
      : candidate.attributes?.albumName || ''
    
    const albumSimilarity = stringSimilarity(
      original.album.toLowerCase(),
      candidateAlbum.toLowerCase()
    )
    score += albumSimilarity * 0.2
  } else {
    score += 0.2 // Give full points if no album to compare
  }

  return Math.min(score, 1.0)
}

function stringSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein distance-based similarity
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}