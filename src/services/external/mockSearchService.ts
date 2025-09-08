// Mock search service for demonstration
// In production, this would integrate with multiple APIs (Spotify, YouTube Music, etc.)

export interface MockSong {
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
  // Metadata for matching
  isrc?: string;
  releaseDate?: string;
  genres?: string[];
}

export interface MockSearchResult {
  songs: MockSong[];
  total: number;
  hasMore: boolean;
}

// Mock data for demonstration
const MOCK_SONGS: MockSong[] = [
  {
    id: "mock_1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 355000,
    popularity: 95,
    previewUrl: "https://p.scdn.co/mp3-preview/example1.mp3",
    imageUrl: "https://i.scdn.co/image/example1.jpg",
    spotifyId: "4uLU6hMCjMI75M1A2tKUQC",
    spotifyUri: "spotify:track:4uLU6hMCjMI75M1A2tKUQC",
    spotifyUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
    youtubeId: "fJ9rUzIMcZQ",
    youtubeUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    isrc: "GBUM71029601",
    releaseDate: "1975-10-31",
    genres: ["Rock", "Progressive Rock"]
  },
  {
    id: "mock_2",
    title: "Imagine",
    artist: "John Lennon",
    album: "Imagine",
    duration: 183000,
    popularity: 90,
    previewUrl: "https://p.scdn.co/mp3-preview/example2.mp3",
    imageUrl: "https://i.scdn.co/image/example2.jpg",
    spotifyId: "7pKfPomDEeI4TPD6f8VmXQ",
    spotifyUri: "spotify:track:7pKfPomDEeI4TPD6f8VmXQ",
    spotifyUrl: "https://open.spotify.com/track/7pKfPomDEeI4TPD6f8VmXQ",
    youtubeId: "YkgkThdzX-8",
    youtubeUrl: "https://www.youtube.com/watch?v=YkgkThdzX-8",
    isrc: "GBUM71029602",
    releaseDate: "1971-09-09",
    genres: ["Rock", "Pop"]
  },
  {
    id: "mock_3",
    title: "Hotel California",
    artist: "Eagles",
    album: "Hotel California",
    duration: 391000,
    popularity: 88,
    previewUrl: "https://p.scdn.co/mp3-preview/example3.mp3",
    imageUrl: "https://i.scdn.co/image/example3.jpg",
    spotifyId: "40riOy7x9Wj0G1sMGceXsN",
    spotifyUri: "spotify:track:40riOy7x9Wj0G1sMGceXsN",
    spotifyUrl: "https://open.spotify.com/track/40riOy7x9Wj0G1sMGceXsN",
    youtubeId: "BciS5krYL80",
    youtubeUrl: "https://www.youtube.com/watch?v=BciS5krYL80",
    isrc: "USRC17607839",
    releaseDate: "1976-12-08",
    genres: ["Rock", "Soft Rock"]
  },
  {
    id: "mock_4",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    album: "Led Zeppelin IV",
    duration: 482000,
    popularity: 92,
    previewUrl: "https://p.scdn.co/mp3-preview/example4.mp3",
    imageUrl: "https://i.scdn.co/image/example4.jpg",
    spotifyId: "5CQ30WqJwcep0pYcV4AMNc",
    spotifyUri: "spotify:track:5CQ30WqJwcep0pYcV4AMNc",
    spotifyUrl: "https://open.spotify.com/track/5CQ30WqJwcep0pYcV4AMNc",
    youtubeId: "QkF3oxziUI4",
    youtubeUrl: "https://www.youtube.com/watch?v=QkF3oxziUI4",
    isrc: "GBUM71029603",
    releaseDate: "1971-11-08",
    genres: ["Rock", "Hard Rock"]
  },
  {
    id: "mock_5",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    album: "Appetite for Destruction",
    duration: 356000,
    popularity: 89,
    previewUrl: "https://p.scdn.co/mp3-preview/example5.mp3",
    imageUrl: "https://i.scdn.co/image/example5.jpg",
    spotifyId: "7snQQk1zcKl8gZ92AnueZW",
    spotifyUri: "spotify:track:7snQQk1zcKl8gZ92AnueZW",
    spotifyUrl: "https://open.spotify.com/track/7snQQk1zcKl8gZ92AnueZW",
    youtubeId: "1w7OgIpmRwA",
    youtubeUrl: "https://www.youtube.com/watch?v=1w7OgIpmRwA",
    isrc: "USRC18707839",
    releaseDate: "1987-06-21",
    genres: ["Rock", "Hard Rock"]
  }
];

export class MockSearchService {
  /**
   * Search for songs using mock data
   * In production, this would search multiple APIs
   */
  async searchSongs(query: string, limit: number = 20): Promise<MockSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const searchTerm = query.toLowerCase();
    const filteredSongs = MOCK_SONGS.filter(song => 
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm) ||
      song.album?.toLowerCase().includes(searchTerm)
    );
    
    return {
      songs: filteredSongs.slice(0, limit),
      total: filteredSongs.length,
      hasMore: filteredSongs.length > limit
    };
  }
  
  /**
   * Get song by ID
   */
  async getSongById(id: string): Promise<MockSong | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_SONGS.find(song => song.id === id) || null;
  }
}
