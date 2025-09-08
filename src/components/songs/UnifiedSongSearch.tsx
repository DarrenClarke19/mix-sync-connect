import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { UnifiedSearchService, UnifiedSong } from "@/services/external/unifiedSearchService";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Music, Search, Plus, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface UnifiedSongSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (song: UnifiedSong) => void;
  playlistName?: string;
}

export const UnifiedSongSearch = ({ 
  isOpen, 
  onClose, 
  onAddSong, 
  playlistName 
}: UnifiedSongSearchProps) => {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useFirebaseAuth();
  const searchService = useRef(new UnifiedSearchService());
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim().length < 2) {
      setSongs([]);
      setHasSearched(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      await searchSongs(query.trim());
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const results = await searchService.current.searchSongs(searchQuery, 20);
      setSongs(results.songs);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search songs");
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = (song: UnifiedSong) => {
    console.log('🎵 Adding song:', song.title, 'to playlist:', playlistName);
    
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
    
    console.log('🎵 Converted song data:', playlistSong);
    onAddSong(playlistSong);
    toast.success(`"${song.title}" added to ${playlistName || 'playlist'}!`);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-card border border-border/50 backdrop-blur-sm max-w-5xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Search className="w-4 h-4 text-primary-foreground" />
            </div>
            Search Songs for {playlistName ? `"${playlistName}"` : 'Playlist'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
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
                {songs.map((song) => (
                  <Card 
                    key={song.id} 
                    className="bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Album Art */}
                        <div className="relative flex-shrink-0">
                          {song.imageUrl ? (
                            <img 
                              src={song.imageUrl} 
                              alt={song.album} 
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center">
                              <Music className="w-7 h-7 text-primary-foreground" />
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
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-semibold text-sm leading-tight mb-1">{song.title}</h3>
                          <p className="text-xs text-muted-foreground mb-1">
                            {song.artist}
                          </p>
                          {song.album && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {song.album}
                            </p>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-2 mb-3">
                            {song.duration && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {formatDuration(song.duration)}
                              </Badge>
                            )}
                            {song.popularity && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {song.popularity}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <div className="flex gap-2">
                            {song.spotifyUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(song.spotifyUrl, '_blank')}
                                className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="hidden lg:inline">Spotify</span>
                              </Button>
                            )}
                            {song.youtubeUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(song.youtubeUrl, '_blank')}
                                className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="hidden lg:inline">YouTube</span>
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={() => handleAddSong(song)}
                            className="flex items-center gap-1 text-xs px-3 py-1 h-7 font-semibold bg-gradient-primary hover:scale-105 shadow-lg hover:shadow-glow w-full"
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
                <p>Start typing to search for songs</p>
                <p className="text-sm">Search by song title, artist, or album</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
