// Spotify export service for creating actual playlists on Spotify

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: { spotify: string };
}

export class SpotifyExportService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Get current user's profile
  async getCurrentUser(): Promise<{ id: string; display_name: string } | null> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const user = await response.json();
      return {
        id: user.id,
        display_name: user.display_name
      };
    } catch (error) {
      console.error('Failed to get Spotify user:', error);
      return null;
    }
  }

  // Search for a track on Spotify
  async searchTrack(query: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search Spotify');
      }

      const data = await response.json();
      if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
        return data.tracks.items[0].uri; // Return Spotify URI
      }

      return null;
    } catch (error) {
      console.error('Spotify search error:', error);
      return null;
    }
  }

  // Create a new playlist on Spotify
  async createPlaylist(userId: string, name: string, description: string): Promise<string | null> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: false // Make it private by default
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Spotify playlist');
      }

      const playlist = await response.json();
      return playlist.id;
    } catch (error) {
      console.error('Spotify playlist creation error:', error);
      return null;
    }
  }

  // Add tracks to a Spotify playlist
  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<boolean> {
    try {
      // Spotify API allows max 100 tracks per request
      const batchSize = 100;
      
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        
        const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: batch
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to add tracks batch ${i / batchSize + 1}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Spotify add tracks error:', error);
      return false;
    }
  }

  // Export a playlist to Spotify (main function)
  async exportPlaylist(playlistName: string, songs: Array<{ title: string; artist: string; platform?: string; platform_id?: string }>): Promise<{ success: boolean; playlistUrl?: string; message: string }> {
    try {
      console.log(`Exporting playlist "${playlistName}" with ${songs.length} songs to Spotify`);

      // Get current user
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Failed to get Spotify user profile' };
      }

      // Create playlist
      const playlistId = await this.createPlaylist(user.id, playlistName, `Exported from MixMate - ${new Date().toLocaleDateString()}`);
      if (!playlistId) {
        return { success: false, message: 'Failed to create Spotify playlist' };
      }

      // Search for and collect track URIs
      const trackUris: string[] = [];
      const failedSongs: string[] = [];

      for (const song of songs) {
        // If it's already a Spotify song, use the platform_id
        if (song.platform === 'spotify' && song.platform_id) {
          trackUris.push(`spotify:track:${song.platform_id}`);
        } else {
          // Search for the song
          const query = `${song.title} ${song.artist}`;
          const trackUri = await this.searchTrack(query);
          
          if (trackUri) {
            trackUris.push(trackUri);
          } else {
            failedSongs.push(`${song.title} - ${song.artist}`);
          }
        }
      }

      // Add tracks to playlist
      if (trackUris.length > 0) {
        const added = await this.addTracksToPlaylist(playlistId, trackUris);
        if (!added) {
          return { success: false, message: 'Failed to add tracks to playlist' };
        }
      }

      // Get playlist URL
      const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;

      let message = `Successfully exported ${trackUris.length} songs to Spotify!`;
      if (failedSongs.length > 0) {
        message += ` ${failedSongs.length} songs could not be found.`;
      }

      return { 
        success: true, 
        playlistUrl, 
        message 
      };

    } catch (error) {
      console.error('Spotify export error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}
