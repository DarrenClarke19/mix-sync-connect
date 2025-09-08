import { Button } from "@/components/ui/button";
import { Music, ExternalLink } from "lucide-react";
import { initializeSpotifyAuth } from "@/services/external/spotifyService";
import { toast } from "sonner";

export const SpotifyConnectButton = () => {
  const handleConnectSpotify = () => {
    try {
      initializeSpotifyAuth();
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error("Failed to connect to Spotify");
    }
  };

  return (
    <Button 
      onClick={handleConnectSpotify}
      variant="gradient"
      className="flex items-center gap-2"
    >
      <Music className="w-4 h-4" />
      Connect Spotify
      <ExternalLink className="w-4 h-4" />
    </Button>
  );
};
