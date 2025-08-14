import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Search, Music, Plus, ExternalLink, Play } from "lucide-react";

interface SongSearchProps {
  onAddSong: (song: { title: string; artist: string; platform: string; platform_id?: string }) => void;
  currentPlatform?: string;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration_ms?: number;
  preview_url?: string;
  image_url?: string;
  external_urls?: any;
  platform: string;
  platform_id: string;
  platform_data?: any;
}

export const SongSearch = ({ onAddSong, currentPlatform }: SongSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(currentPlatform || "spotify");
  const { profile } = useAuth();

  const platforms = [
    { id: "spotify", name: "Spotify", color: "bg-green-600", connected: !!profile?.spotify_token },
    { id: "apple_music", name: "Apple Music", color: "bg-blue-600", connected: !!profile?.apple_music_token },
  ];

  const searchSongs = async () => {
    if (!query.trim() || !selectedPlatform) return;

    setIsSearching(true);
    setResults([]);

    try {
      if (selectedPlatform === "spotify" && profile?.spotify_token) {
        await searchSpotify(query);
      } else if (selectedPlatform === "apple_music" && profile?.apple_music_token) {
        await searchAppleMusic(query);
      } else {
        toast.error(`Please connect your ${selectedPlatform} account first`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for songs");
    } finally {
      setIsSearching(false);
    }
  };

  const searchSpotify = async (searchQuery: string) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`, {
        headers: {
          'Authorization': `Bearer ${profile?.spotify_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Spotify search failed');
      }

      const data = await response.json();
      
      if (data.tracks?.items) {
        const formattedResults = data.tracks.items.map((track: any) => ({
          id: track.id,
          title: track.name,
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          album: track.album?.name,
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          image_url: track.album?.images?.[0]?.url,
          external_urls: track.external_urls,
          platform: "spotify",
          platform_id: track.id,
          platform_data: track,
        }));

        setResults(formattedResults);
      }
    } catch (error) {
      console.error("Spotify search error:", error);
      toast.error("Failed to search Spotify");
    }
  };

  const searchAppleMusic = async (searchQuery: string) => {
    // For now, show a placeholder since Apple Music integration is not fully implemented
    toast.info("Apple Music search coming soon!");
    setResults([]);
  };

  const handleAddSong = (song: SearchResult) => {
    onAddSong({
      title: song.title,
      artist: song.artist,
      platform: song.platform,
      platform_id: song.platform_id,
    });
    
    // Clear search after adding
    setQuery("");
    setResults([]);
    toast.success(`Added "${song.title}" to playlist`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchSongs();
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Songs
          </CardTitle>
          <CardDescription>
            Search for songs on your connected music platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selection */}
          <div className="flex gap-2">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                variant={selectedPlatform === platform.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform(platform.id)}
                disabled={!platform.connected}
                className={`flex items-center gap-2 ${
                  !platform.connected ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                {platform.name}
                {!platform.connected && (
                  <Badge variant="secondary" className="text-xs">
                    Not Connected
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for a song, artist, or album..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={searchSongs} 
              disabled={!query.trim() || isSearching}
              size="sm"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Song Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {song.image_url ? (
                      <img 
                        src={song.image_url} 
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{song.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist}
                    </p>
                    {song.album && (
                      <p className="text-xs text-muted-foreground truncate">
                        {song.album}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  {song.duration_ms && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDuration(song.duration_ms)}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    {song.preview_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const audio = new Audio(song.preview_url);
                          audio.play();
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {song.external_urls?.spotify && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(song.external_urls.spotify, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddSong(song)}
                      className="h-8 px-3"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && !isSearching && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No songs found for "{query}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
