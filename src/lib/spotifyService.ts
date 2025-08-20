// Spotify API endpoints
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify/callback`;

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  duration_ms: number;
  external_urls: { spotify: string };
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: { total: number };
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
}

// Initialize Spotify OAuth
export const initializeSpotifyAuth = () => {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify Client ID not configured');
  }

  const scope = [
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-private',
    'user-read-email'
  ].join(' ');

  const state = Math.random().toString(36).substring(7);
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope,
    state,
    show_dialog: 'true'
  });

  // Store state for verification
  localStorage.setItem('spotify_auth_state', state);
  
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
};

// Exchange authorization code for tokens
export const exchangeSpotifyCode = async (code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> => {
  const response = await fetch('/api/spotify/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, redirect_uri: SPOTIFY_REDIRECT_URI }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
};

// Search for tracks
export const searchSpotifyTracks = async (
  query: string, 
  accessToken: string, 
  limit: number = 20
): Promise<SpotifyTrack[]> => {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search Spotify');
  }

  const data = await response.json();
  return data.tracks?.items || [];
};

// Get user's playlists
export const getSpotifyPlaylists = async (accessToken: string): Promise<SpotifyPlaylist[]> => {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify playlists');
  }

  const data = await response.json();
  return data.items || [];
};

// Create Spotify playlist
export const createSpotifyPlaylist = async (
  name: string,
  description: string,
  accessToken: string,
  userId: string
): Promise<SpotifyPlaylist> => {
  const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Spotify playlist');
  }

  return response.json();
};

// Add tracks to Spotify playlist
export const addTracksToSpotifyPlaylist = async (
  playlistId: string,
  trackUris: string[],
  accessToken: string
): Promise<void> => {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add tracks to Spotify playlist');
  }
};

// Get current user profile
export const getSpotifyProfile = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify profile');
  }

  return response.json();
};
