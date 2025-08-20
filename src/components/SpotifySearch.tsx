import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Search, Music, Plus, ExternalLink, Play, Music2, AlertCircle } from "lucide-react";
import { SPOTIFY_REFRESH_TOKEN_URL } from "@/lib/firebaseConfig";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  duration_ms: number;
  external_urls: { spotify: string };
  uri: string;
}

interface SpotifySearchProps {
  onAddSong: (song: { title: string; artist: string; platform: string; platform_id?: string }) => void;
}

export const SpotifySearch = ({ onAddSong }: SpotifySearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Check for stored Spotify token on component mount
  useEffect(() => {
    const checkSpotifyConnection = async () => {
      const storedToken = localStorage.getItem('spotify_access_token');
      const tokenExpiresAt = localStorage.getItem('spotify_token_expires_at');
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      
      if (storedToken && tokenExpiresAt) {
        const expiresAt = parseInt(tokenExpiresAt);
        const now = Date.now();
        
        if (now < expiresAt) {
          // Token is still valid
          setAccessToken(storedToken);
          setIsConnected(true);
          setMessage("Connected to Spotify - you can search and add songs!");
        } else if (refreshToken) {
          // Token expired but we have refresh token - try to refresh
          setMessage("Refreshing Spotify token...");
          const newToken = await refreshSpotifyToken(refreshToken);
          if (!newToken) {
            setMessage("Failed to refresh token. Please reconnect.");
            setIsConnected(false);
          }
        } else {
          // Token expired and no refresh token
          setMessage("Spotify connection expired. Please reconnect.");
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
        setMessage("Connect to Spotify to search and add songs");
      }
    };

    checkSpotifyConnection();
  }, []);

  // Function to refresh Spotify access token
  const refreshSpotifyToken = async (refreshToken: string) => {
    try {
      const response = await fetch(SPOTIFY_REFRESH_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      
      // Store the new access token and expiration
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_token_expires_at", 
        (Date.now() + data.expires_in * 1000).toString()
      );
      
      setAccessToken(data.access_token);
      setIsConnected(true);
      setMessage("Connected to Spotify - you can search and add songs!");
      toast.success("Spotify token refreshed successfully!");
      
      return data.access_token;
    } catch (error) {
      console.error("Failed to refresh Spotify token:", error);
      toast.error("Failed to refresh token");
      return null;
    }
  };

  const connectSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      toast.error("Spotify Client ID not configured");
      return;
    }

    // Use the current origin dynamically for the redirect URI
    const redirectUri = encodeURIComponent(`${window.location.origin}/spotify/callback`);
    const scope = encodeURIComponent('playlist-read-private playlist-modify-private playlist-modify-public user-read-private user-read-email');
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&show_dialog=true`;
    
    window.location.href = authUrl;
  };

  const connectSpotifyFallback = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      toast.error("Spotify Client ID not configured");
      return;
    }

    // Use a simpler OAuth flow with implicit grant (less secure but no backend required)
    // For this to work, you need to add your current domain to Spotify app redirect URIs
    const scope = encodeURIComponent('playlist-read-private playlist-modify-private playlist-modify-public user-read-private user-read-email');
    
    // Use the same redirect URI as the full access method for consistency
    const redirectUri = encodeURIComponent(`${window.location.origin}/spotify/callback`);
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&show_dialog=true`;
    
    // Instead of popup, redirect the main window for simplicity
    window.location.href = authUrl;
  };

  const searchSpotify = async () => {
    if (!query.trim() || !accessToken) {
      toast.error("Please connect to Spotify first");
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it and ask user to reconnect
          localStorage.removeItem('spotify_access_token');
          setAccessToken(null);
          setIsConnected(false);
          toast.error("Spotify connection expired. Please reconnect.");
          return;
        }
        throw new Error('Failed to search Spotify');
      }

      const data = await response.json();
      if (data.tracks && data.tracks.items) {
        setResults(data.tracks.items);
      }
    } catch (error) {
      console.error("Spotify search error:", error);
      toast.error("Failed to search Spotify");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = (track: SpotifyTrack) => {
    onAddSong({
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      platform: "spotify",
      platform_id: track.id,
    });

    setQuery("");
    setResults([]);
    toast.success(`Added "${track.name}" to playlist`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchSpotify();
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openSpotifyTrack = (spotifyUrl: string) => {
    window.open(spotifyUrl, '_blank');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-green-600" />
            Connect Spotify
          </CardTitle>
          <CardDescription>
            {message || "Connect your Spotify account to search and add songs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Spotify account to search for songs and add them to your playlists
            </p>
            
            {/* Primary connection method */}
            <Button 
              onClick={connectSpotify}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Connect Spotify (Full Access)
            </Button>
            
            {/* Fallback method */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              onClick={connectSpotifyFallback}
              variant="outline"
              className="w-full"
            >
              Connect Spotify (Basic Access)
            </Button>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Full Access: Complete integration with refresh tokens</p>
              <p>• Basic Access: Simple connection without backend (limited features)</p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              You'll need a Spotify account to use this feature
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-green-600" />
          Search Spotify
        </CardTitle>
        <CardDescription>
          Search for songs on Spotify and add them to your playlist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search Spotify for songs, artists, or albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={searchSpotify}
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
        
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {track.album.images[0] ? (
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{track.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists.map(artist => artist.name).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.album.name}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDuration(track.duration_ms)}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openSpotifyTrack(track.external_urls.spotify)}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddSong(track)}
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
        
        {query && !isSearching && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No songs found for "{query}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>Powered by Spotify Web API</p>
          <p>Results include official tracks from Spotify's catalog</p>
        </div>
      </CardContent>
    </Card>
  );
};
