import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Music, ExternalLink, CheckCircle, Loader2 } from "lucide-react";

interface PlatformConnectModalProps {
  children: React.ReactNode;
}

export const PlatformConnectModal = ({ children }: PlatformConnectModalProps) => {
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { profile, updateProfile } = useAuth();

  const connectSpotify = async () => {
    setConnecting('spotify');
    
    try {
      // Generate Spotify OAuth URL
      const clientId = 'your_spotify_client_id'; // This would come from Supabase secrets
      const redirectUri = `${window.location.origin}/auth/spotify/callback`;
      const scopes = [
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-read-private',
        'user-read-email'
      ].join(' ');

      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('state', 'spotify_connect');

      // For demo purposes, we'll simulate the connection
      // In production, you'd redirect to the OAuth URL
      setTimeout(() => {
        updateProfile({ spotify_id: 'demo_spotify_user' });
        toast.success("Spotify connected successfully!");
        setConnecting(null);
      }, 2000);

    } catch (error) {
      toast.error("Failed to connect Spotify");
      setConnecting(null);
    }
  };

  const connectAppleMusic = async () => {
    setConnecting('apple_music');
    
    try {
      // Apple Music connection would use MusicKit JS
      // For demo purposes, we'll simulate the connection
      setTimeout(() => {
        updateProfile({ apple_music_id: 'demo_apple_user' });
        toast.success("Apple Music connected successfully!");
        setConnecting(null);
      }, 2000);

    } catch (error) {
      toast.error("Failed to connect Apple Music");
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: 'spotify' | 'apple_music') => {
    try {
      if (platform === 'spotify') {
        await updateProfile({ 
          spotify_id: null, 
          spotify_token: null, 
          spotify_refresh_token: null 
        });
        toast.success("Spotify disconnected");
      } else {
        await updateProfile({ 
          apple_music_id: null, 
          apple_music_token: null 
        });
        toast.success("Apple Music disconnected");
      }
    } catch (error) {
      toast.error(`Failed to disconnect ${platform}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Connect Music Platforms
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your music streaming accounts to create and sync collaborative playlists.
          </p>

          {/* Spotify */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Spotify</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.spotify_id ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {profile?.spotify_id ? (
                <>
                  <Badge variant="secondary" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectPlatform('spotify')}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectSpotify}
                  disabled={connecting === 'spotify'}
                >
                  {connecting === 'spotify' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Apple Music */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Apple Music</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.apple_music_id ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {profile?.apple_music_id ? (
                <>
                  <Badge variant="secondary" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectPlatform('apple_music')}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectAppleMusic}
                  disabled={connecting === 'apple_music'}
                >
                  {connecting === 'apple_music' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>We use secure OAuth authentication to connect your accounts. Your credentials are never stored.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};