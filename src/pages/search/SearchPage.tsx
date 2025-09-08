import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedSearchService, UnifiedSong } from "@/services/external/unifiedSearchService";
import { SpotifyConnectButton } from "@/components/SpotifyConnectButton";
import { usePlaylists } from "@/hooks/playlists/usePlaylists";
import { useSongs } from "@/hooks/songs/useSongs";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Search, Music, Plus, Play, ExternalLink, Youtube } from "lucide-react";
import { toast } from "sonner";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const { user } = useFirebaseAuth();
  const { playlists } = usePlaylists();
  const { addSong } = useSongs();
  const searchService = new UnifiedSearchService();

  // Check API availability
  useEffect(() => {
    setSpotifyConnected(searchService.isSpotifyConnected());
    setAvailableSources(searchService.getAvailableSources());
  }, []);

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const results = await searchService.searchSongs(searchQuery, 20);
      setSongs(results.songs);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search songs");
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSongs(query.trim());
  };

  const handlePlayPreview = (previewUrl: string) => {
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audio.play().catch(() => {
        toast.error("Preview not available");
      });
    } else {
      toast.error("Preview not available");
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddSong = async (song: UnifiedSong) => {
    if (!selectedPlaylistId) {
      toast.error("Please select a playlist first");
      return;
    }

    try {
      // Convert UnifiedSong to the format expected by the playlist
      const playlistSong = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        platform: song.spotifyId ? 'spotify' : song.youtubeId ? 'youtube' : 'unknown',
        platform_id: song.spotifyId || song.youtubeId || song.id,
        spotify_id: song.spotifyId,
        youtube_id: song.youtubeId,
        duration: song.duration,
        popularity: song.popularity,
        preview_url: song.previewUrl,
        image_url: song.imageUrl,
        isrc: song.isrc,
        release_date: song.releaseDate,
        genres: song.genres,
        added_by: user?.uid || 'anonymous',
        added_at: new Date().toISOString(),
        likes: 0,
        liked_by: []
      };

      await addSong(selectedPlaylistId, playlistSong);
      toast.success(`"${song.title}" added to playlist!`);
    } catch (error) {
      console.error('Error adding song:', error);
      toast.error("Failed to add song to playlist");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Search Songs</h1>
          <p className="text-muted-foreground">Find songs from multiple sources to add to your playlists</p>
          {availableSources.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Searching:</span>
              {availableSources.map((source, index) => (
                <Badge key={source} variant="secondary" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {!spotifyConnected && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-2">Connect Spotify to export playlists</p>
            <SpotifyConnectButton />
          </div>
        )}
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          <Button type="submit" variant="gradient" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        
        {/* Playlist Selector */}
        {playlists.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Add to playlist:</span>
            <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form>

      {/* Search Results */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Searching...</span>
          </div>
        )}

        {!loading && hasSearched && songs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No songs found for "{query}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}

        {!loading && songs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Search Results</h2>
            {songs.map((song) => (
              <Card 
                key={song.id} 
                className="bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Album Art */}
                    <div className="relative">
                      {song.imageUrl ? (
                        <img 
                          src={song.imageUrl} 
                          alt={song.album} 
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-primary-foreground" />
                        </div>
                      )}
                      
                      {/* Play Preview Button */}
                      {song.previewUrl && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute -bottom-1 -right-1 w-6 h-6 p-0 rounded-full"
                          onClick={() => handlePlayPreview(song.previewUrl!)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{song.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {song.artist}
                      </p>
                      {song.album && (
                        <p className="text-xs text-muted-foreground truncate">
                          {song.album}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {song.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {formatDuration(song.duration)}
                        </Badge>
                      )}
                      {song.popularity && (
                        <Badge variant="outline" className="text-xs">
                          {song.popularity}% popular
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {song.spotifyUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(song.spotifyUrl, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Spotify
                        </Button>
                      )}
                      {song.youtubeUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(song.youtubeUrl, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <Youtube className="w-3 h-3" />
                          YouTube
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => handleAddSong(song)}
                        disabled={!selectedPlaylistId}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start searching for songs</p>
            <p className="text-sm">Search by song title, artist, or album</p>
          </div>
        )}
      </div>
    </div>
  );
}
