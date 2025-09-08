// Real search service integrating Spotify and YouTube APIs
// Uses ISRC codes for accurate cross-platform matching

export interface RealSong {
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
  youtubeTitle?: string;
  youtubeChannel?: string;
  // Metadata for accurate matching
  isrc?: string; // International Standard Recording Code
  releaseDate?: string;
  genres?: string[];
  // Source tracking
  source: 'spotify' | 'youtube' | 'combined';
}

export interface RealSearchResult {
  songs: RealSong[];
  total: number;
  hasMore: boolean;
}

export class RealSearchService {
  private spotifyAccessToken: string | null = null;
  private youtubeApiKey: string | null = null;

  constructor() {
    this.spotifyAccessToken = localStorage.getItem('spotify_access_token');
    this.youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || null;
  }

  /**
   * Search for songs using both Spotify and YouTube APIs
   * Combines results and deduplicates using ISRC codes
   */
  async searchSongs(query: string, limit: number = 20): Promise<RealSearchResult> {
    try {
      const searchPromises = [];
      
      // Search Spotify if token available
      if (this.spotifyAccessToken) {
        searchPromises.push(this.searchSpotify(query, Math.ceil(limit / 2)));
      }
      
      // Search YouTube if API key available
      if (this.youtubeApiKey) {
        searchPromises.push(this.searchYouTube(query, Math.ceil(limit / 2)));
      }

      // If no APIs available, return empty result
      if (searchPromises.length === 0) {
        return {
          songs: [],
          total: 0,
          hasMore: false
        };
      }

      const results = await Promise.allSettled(searchPromises);
      const allSongs: RealSong[] = [];

      // Process successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allSongs.push(...result.value);
        } else {
          console.error(`Search API ${index} failed:`, result.reason);
        }
      });

      // Deduplicate songs using ISRC codes and title/artist matching
      const deduplicatedSongs = this.deduplicateSongs(allSongs);
      
      // Sort by popularity/relevance
      const sortedSongs = this.sortSongs(deduplicatedSongs, query);

      return {
        songs: sortedSongs.slice(0, limit),
        total: sortedSongs.length,
        hasMore: sortedSongs.length > limit
      };
    } catch (error) {
      console.error('Error searching songs:', error);
      throw new Error('Failed to search songs');
    }
  }

  /**
   * Search Spotify API
   */
  private async searchSpotify(query: string, limit: number): Promise<RealSong[]> {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.spotifyAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data = await response.json();
      const tracks = data.tracks?.items || [];

      return tracks.map((track: any) => ({
        id: `spotify_${track.id}`,
        title: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album?.name,
        duration: track.duration_ms,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        imageUrl: track.album?.images[0]?.url,
        // Spotify-specific data
        spotifyId: track.id,
        spotifyUri: track.uri,
        spotifyUrl: track.external_urls?.spotify,
        // Metadata for matching
        isrc: track.external_ids?.isrc,
        releaseDate: track.album?.release_date,
        genres: track.artists[0]?.genres || [],
        source: 'spotify' as const
      }));
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  /**
   * Search YouTube Data API
   */
  private async searchYouTube(query: string, limit: number): Promise<RealSong[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video&maxResults=${limit}&key=${this.youtubeApiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      const videos = data.items || [];

      return videos.map((video: any) => {
        const snippet = video.snippet;
        return {
          id: `youtube_${video.id.videoId}`,
          title: this.extractSongTitle(snippet.title),
          artist: this.extractArtist(snippet.title, snippet.channelTitle),
          album: undefined, // YouTube doesn't provide album info
          duration: undefined, // Would need additional API call
          popularity: undefined, // YouTube doesn't provide popularity
          previewUrl: undefined, // YouTube doesn't provide preview URLs
          imageUrl: snippet.thumbnails?.high?.url,
          // YouTube-specific data
          youtubeId: video.id.videoId,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          youtubeTitle: snippet.title,
          youtubeChannel: snippet.channelTitle,
          // Metadata for matching
          isrc: undefined, // YouTube doesn't provide ISRC
          releaseDate: snippet.publishedAt,
          genres: [],
          source: 'youtube' as const
        };
      });
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  /**
   * Extract song title from YouTube video title
   */
  private extractSongTitle(videoTitle: string): string {
    // Remove common YouTube suffixes
    const cleanTitle = videoTitle
      .replace(/\s*\(Official Music Video\)/gi, '')
      .replace(/\s*\(Official Video\)/gi, '')
      .replace(/\s*\(Official Audio\)/gi, '')
      .replace(/\s*\(Lyrics\)/gi, '')
      .replace(/\s*\(HD\)/gi, '')
      .replace(/\s*\(4K\)/gi, '')
      .replace(/\s*\[Official Video\]/gi, '')
      .replace(/\s*\[Official Audio\]/gi, '')
      .replace(/\s*\[Lyrics\]/gi, '')
      .trim();
    
    return cleanTitle;
  }

  /**
   * Extract artist from YouTube video title and channel
   */
  private extractArtist(videoTitle: string, channelTitle: string): string {
    // Try to extract artist from title (format: "Artist - Song Title")
    const titleMatch = videoTitle.match(/^([^-]+)\s*-\s*(.+)$/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Fallback to channel name
    return channelTitle;
  }

  /**
   * Deduplicate songs using ISRC codes and fuzzy matching
   */
  private deduplicateSongs(songs: RealSong[]): RealSong[] {
    const seen = new Map<string, RealSong>();
    const deduplicated: RealSong[] = [];

    for (const song of songs) {
      let key = '';
      
      // Primary key: ISRC code (most accurate)
      if (song.isrc) {
        key = `isrc_${song.isrc}`;
      } else {
        // Fallback: normalized title + artist
        key = `title_${this.normalizeText(song.title)}_${this.normalizeText(song.artist)}`;
      }

      if (!seen.has(key)) {
        seen.set(key, song);
        deduplicated.push(song);
      } else {
        // Merge data from different sources
        const existing = seen.get(key)!;
        const merged = this.mergeSongData(existing, song);
        seen.set(key, merged);
      }
    }

    return deduplicated;
  }

  /**
   * Merge song data from different sources
   */
  private mergeSongData(song1: RealSong, song2: RealSong): RealSong {
    return {
      ...song1,
      // Prefer Spotify data when available
      spotifyId: song1.spotifyId || song2.spotifyId,
      spotifyUri: song1.spotifyUri || song2.spotifyUri,
      spotifyUrl: song1.spotifyUrl || song2.spotifyUrl,
      // Add YouTube data if not present
      youtubeId: song1.youtubeId || song2.youtubeId,
      youtubeUrl: song1.youtubeUrl || song2.youtubeUrl,
      youtubeTitle: song1.youtubeTitle || song2.youtubeTitle,
      youtubeChannel: song1.youtubeChannel || song2.youtubeChannel,
      // Prefer Spotify metadata (more accurate)
      duration: song1.duration || song2.duration,
      popularity: song1.popularity || song2.popularity,
      previewUrl: song1.previewUrl || song2.previewUrl,
      imageUrl: song1.imageUrl || song2.imageUrl,
      album: song1.album || song2.album,
      isrc: song1.isrc || song2.isrc,
      releaseDate: song1.releaseDate || song2.releaseDate,
      genres: song1.genres.length > 0 ? song1.genres : song2.genres,
      source: 'combined' as const
    };
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Sort songs by relevance and popularity
   */
  private sortSongs(songs: RealSong[], query: string): RealSong[] {
    const queryLower = query.toLowerCase();
    
    return songs.sort((a, b) => {
      // Exact title match gets highest priority
      const aTitleMatch = a.title.toLowerCase().includes(queryLower);
      const bTitleMatch = b.title.toLowerCase().includes(queryLower);
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // Then by popularity (Spotify songs with popularity scores)
      const aPopularity = a.popularity || 0;
      const bPopularity = b.popularity || 0;
      
      if (aPopularity !== bPopularity) {
        return bPopularity - aPopularity;
      }
      
      // Finally by source preference (Spotify > YouTube)
      const sourceOrder = { spotify: 0, combined: 1, youtube: 2 };
      return sourceOrder[a.source] - sourceOrder[b.source];
    });
  }

  /**
   * Check if Spotify is connected
   */
  isSpotifyConnected(): boolean {
    return this.spotifyAccessToken !== null;
  }

  /**
   * Check if YouTube API is configured
   */
  isYouTubeConfigured(): boolean {
    return this.youtubeApiKey !== null;
  }

  /**
   * Get available search sources
   */
  getAvailableSources(): string[] {
    const sources = [];
    if (this.isSpotifyConnected()) sources.push('Spotify');
    if (this.isYouTubeConfigured()) sources.push('YouTube');
    return sources;
  }
}
