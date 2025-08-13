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

    const { action, code, refresh_token } = await req.json()

    if (action === 'exchange_code') {
      // Exchange authorization code for access token
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
      const redirectUri = Deno.env.get('SPOTIFY_REDIRECT_URI')

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Spotify credentials')
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const tokenData = await tokenResponse.json()

      // Get user profile from Spotify
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to get Spotify profile')
      }

      const profileData = await profileResponse.json()

      // Get current user
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update user profile with Spotify data
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_id: profileData.id,
          spotify_token: tokenData.access_token,
          spotify_refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('Failed to update user profile')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          spotify_profile: {
            id: profileData.id,
            display_name: profileData.display_name,
            images: profileData.images,
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } else if (action === 'refresh_token') {
      // Refresh expired access token
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

      if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials')
      }

      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token,
        }),
      })

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token')
      }

      const refreshData = await refreshResponse.json()

      // Get current user
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update user profile with new token
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_token: refreshData.access_token,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('Failed to update user profile')
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})