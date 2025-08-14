import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Music, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface PlatformConnectModalProps {
  children: React.ReactNode;
}

export const PlatformConnectModal = ({ children }: PlatformConnectModalProps) => {
  const [open, setOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { profile, updateProfile } = useAuth();

  const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/auth/callback';

  const handleSpotifyConnect = async () => {
    if (!spotifyClientId) {
      toast.error("Spotify client ID not configured");
      return;
    }

    setIsConnecting(true);
    
    try {
      // Generate Spotify OAuth URL
      const scope = 'playlist-read-private playlist-modify-private playlist-modify-public user-read-private';
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${spotifyClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${Math.random().toString(36).substring(7)}`;
      
      // Store the redirect URI in localStorage for the callback
      localStorage.setItem('spotify_redirect_uri', redirectUri);
      
      // Open Spotify OAuth in a new window
      const authWindow = window.open(authUrl, 'spotify-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      // Listen for the callback
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          
          // Check if we have a token (this would be set by the callback handler)
          if (profile?.spotify_token) {
            toast.success("Spotify connected successfully!");
            setOpen(false);
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Spotify connection error:', error);
      toast.error("Failed to connect Spotify");
      setIsConnecting(false);
    }
  };

  const handleSpotifyDisconnect = async () => {
    try {
      await updateProfile({
        spotify_id: null,
        spotify_token: null,
        spotify_refresh_token: null,
        token_expires_at: null,
      });
      toast.success("Spotify disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Spotify");
    }
  };

  const handleAppleMusicConnect = async () => {
    toast.info("Apple Music integration coming soon!");
  };

  const isSpotifyConnected = !!profile?.spotify_token;
  const isAppleMusicConnected = !!profile?.apple_music_token;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Music Platforms</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Spotify Connection */}
          <Card className={isSpotifyConnected ? "border-green-200 bg-green-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Spotify</CardTitle>
                    <CardDescription>
                      Connect your Spotify account to sync playlists
                    </CardDescription>
                  </div>
                </div>
                {isSpotifyConnected && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isSpotifyConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Connected as: {profile?.spotify_id || 'Unknown'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSpotifyDisconnect}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://open.spotify.com', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleSpotifyConnect}
                  disabled={isConnecting}
                  className="w-full"
                  variant="outline"
                >
                  {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect Spotify
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Apple Music Connection */}
          <Card className={isAppleMusicConnected ? "border-blue-200 bg-blue-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Apple Music</CardTitle>
                    <CardDescription>
                      Connect your Apple Music account (Coming Soon)
                    </CardDescription>
                  </div>
                </div>
                {isAppleMusicConnected && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAppleMusicConnect}
                disabled={true}
                className="w-full"
                variant="outline"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Connect at least one platform to start creating collaborative playlists</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};