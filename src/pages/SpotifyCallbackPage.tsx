import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function SpotifyCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Spotify OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Spotify OAuth error:', error);
      return;
    }

    if (code) {
      // Store the authorization code
      localStorage.setItem('spotify_auth_code', code);
      console.log('Spotify authorization code received:', code);
    }

    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <Card className="bg-gradient-card border border-border/50 backdrop-blur-sm max-w-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Spotify Connected!</h1>
          <p className="text-muted-foreground mb-6">
            Your Spotify account has been successfully connected. You can now search for songs and export playlists.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="gradient">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
