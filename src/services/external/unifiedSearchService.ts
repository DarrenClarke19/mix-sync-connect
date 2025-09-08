import { SpotifyService } from './spotifyService';
import { RealSearchService, RealSong } from './realSearchService';

export interface UnifiedSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  popularity?: number;
  previewUrl?: string;
  imageUrl?: string;
  // Platform-specific data for export
  spotifyId?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  // Metadata for accurate matching
  isrc?: string; // International Standard Recording Code
  releaseDate?: string;
  genres?: string[];
}

export interface SearchResult {
  songs: UnifiedSong[];
  total: number;
  hasMore: boolean;
}

export class UnifiedSearchService {
  private realSearchService: RealSearchService;
  private spotifyService: SpotifyService | null = null;

  constructor() {
    this.realSearchService = new RealSearchService();
    // Only initialize Spotify service if user has connected
    const accessToken = localStorage.getItem('spotify_access_token');
    if (accessToken) {
      this.spotifyService = new SpotifyService(accessToken);
    }
  }

  /**
   * Search for songs using real APIs (Spotify + YouTube)
   * No authentication required for searching
   */
  async searchSongs(query: string, limit: number = 20): Promise<SearchResult> {
    try {
      // Use real search service with Spotify and YouTube APIs
      const realResults = await this.realSearchService.searchSongs(query, limit);
      
      // Convert real results to unified format
      const unifiedSongs: UnifiedSong[] = realResults.songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        popularity: song.popularity,
        previewUrl: song.previewUrl,
        imageUrl: song.imageUrl,
        // Platform-specific data for export
        spotifyId: song.spotifyId,
        spotifyUri: song.spotifyUri,
        spotifyUrl: song.spotifyUrl,
        youtubeId: song.youtubeId,
        youtubeUrl: song.youtubeUrl,
        // Metadata for matching
        isrc: song.isrc,
        releaseDate: song.releaseDate,
        genres: song.genres
      }));

      return {
        songs: unifiedSongs,
        total: realResults.total,
        hasMore: realResults.hasMore
      };
    } catch (error) {
      console.error('Error searching songs:', error);
      throw new Error('Failed to search songs');
    }
  }

  /**
   * Connect to Spotify for export functionality
   */
  async connectSpotify(): Promise<boolean> {
    try {
      const accessToken = localStorage.getItem('spotify_access_token');
      if (accessToken) {
        this.spotifyService = new SpotifyService(accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      return false;
    }
  }

  /**
   * Check if Spotify is connected
   */
  isSpotifyConnected(): boolean {
    return this.spotifyService !== null;
  }

  /**
   * Check if YouTube API is configured
   */
  isYouTubeConfigured(): boolean {
    return this.realSearchService.isYouTubeConfigured();
  }

  /**
   * Get available search sources
   */
  getAvailableSources(): string[] {
    return this.realSearchService.getAvailableSources();
  }

  /**
   * Export playlist to Spotify
   * Requires Spotify connection
   */
  async exportToSpotify(playlistName: string, songs: UnifiedSong[]): Promise<{
    success: boolean;
    playlistId?: string;
    error?: string;
  }> {
    if (!this.spotifyService) {
      return {
        success: false,
        error: 'Spotify not connected. Please connect Spotify first.'
      };
    }

    try {
      // Filter songs that have Spotify data
      const spotifySongs = songs.filter(song => song.spotifyId);
      
      if (spotifySongs.length === 0) {
        return {
          success: false,
          error: 'No songs with Spotify data found for export.'
        };
      }

      // Create Spotify playlist
      const playlist = await this.spotifyService.createPlaylist(playlistName, 'Exported from MixMate');
      
      // Add tracks to playlist
      const trackUris = spotifySongs.map(song => song.spotifyUri!);
      await this.spotifyService.addTracksToPlaylist(playlist.id, trackUris);

      return {
        success: true,
        playlistId: playlist.id
      };
    } catch (error) {
      console.error('Error exporting to Spotify:', error);
      return {
        success: false,
        error: 'Failed to export playlist to Spotify'
      };
    }
  }

  /**
   * Verify Spotify song data for accurate export
   * Since we're using Spotify search, this ensures the song still exists
   */
  async verifySpotifySong(unifiedSong: UnifiedSong): Promise<{
    isValid: boolean;
    spotifyId?: string;
    error?: string;
  }> {
    try {
      // If we already have a Spotify ID, verify it still exists
      if (unifiedSong.spotifyId) {
        const track = await this.spotifyService.getTrack(unifiedSong.spotifyId);
        if (track) {
          return {
            isValid: true,
            spotifyId: unifiedSong.spotifyId
          };
        }
      }

      // If no Spotify ID or track not found, search for it
      const searchQuery = `${unifiedSong.title} ${unifiedSong.artist}`;
      const searchResults = await this.spotifyService.searchTracks(searchQuery, 5);
      
      const bestMatch = this.findBestMatch(unifiedSong, searchResults.tracks.items);
      if (bestMatch) {
        return {
          isValid: true,
          spotifyId: bestMatch.id
        };
      }

      return {
        isValid: false,
        error: 'Song not found on Spotify'
      };
    } catch (error) {
      console.error('Error verifying Spotify song:', error);
      return {
        isValid: false,
        error: 'Failed to verify song'
      };
    }
  }

  /**
   * Find the best matching song using fuzzy matching
   */
  private findBestMatch(targetSong: UnifiedSong, candidates: any[]): any | null {
    if (candidates.length === 0) return null;

    // Simple scoring algorithm
    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      let score = 0;

      // Title similarity (case insensitive)
      const titleSimilarity = this.calculateSimilarity(
        targetSong.title.toLowerCase(),
        candidate.name.toLowerCase()
      );
      score += titleSimilarity * 0.4;

      // Artist similarity
      const artistSimilarity = this.calculateSimilarity(
        targetSong.artist.toLowerCase(),
        candidate.artists[0]?.name?.toLowerCase() || ''
      );
      score += artistSimilarity * 0.4;

      // Album similarity (if available)
      if (targetSong.album && candidate.album?.name) {
        const albumSimilarity = this.calculateSimilarity(
          targetSong.album.toLowerCase(),
          candidate.album.name.toLowerCase()
        );
        score += albumSimilarity * 0.2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // Only return if similarity is above threshold
    return bestScore > 0.7 ? bestMatch : null;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Get song details for Spotify export
   * Returns verified Spotify data for accurate playlist creation
   */
  async getSongForSpotifyExport(unifiedSong: UnifiedSong): Promise<{
    id: string;
    title: string;
    artist: string;
    album?: string;
    uri: string;
  } | null> {
    try {
      const verification = await this.verifySpotifySong(unifiedSong);
      
      if (!verification.isValid || !verification.spotifyId) {
        console.warn('Song verification failed:', verification.error);
        return null;
      }

      const spotifyTrack = await this.spotifyService.getTrack(verification.spotifyId);
      if (!spotifyTrack) {
        return null;
      }

      return {
        id: verification.spotifyId,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists[0]?.name || 'Unknown Artist',
        album: spotifyTrack.album?.name,
        uri: spotifyTrack.uri
      };
    } catch (error) {
      console.error('Error getting song for Spotify export:', error);
      return null;
    }
  }
}
