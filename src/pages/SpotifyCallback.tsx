import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Music2 } from "lucide-react";
import { toast } from "sonner";
import { SPOTIFY_TOKEN_EXCHANGE_URL } from "@/lib/firebaseConfig";

export const SpotifyCallback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for both URL search params (authorization code) and hash (access token)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = urlParams.get("code");
        const error = urlParams.get("error") || hashParams.get("error");
        const state = urlParams.get("state");
        const accessToken = hashParams.get("access_token");

        if (error) {
          setStatus("error");
          setMessage("Authorization was denied or failed");
          toast.error("Spotify connection failed");
          return;
        }

        // Handle implicit grant (access token in hash)
        if (accessToken) {
          // Store the access token (note: this method doesn't provide refresh tokens)
          localStorage.setItem("spotify_access_token", accessToken);
          localStorage.setItem("spotify_token_expires_at", 
            (Date.now() + 3600000).toString() // 1 hour default
          );
          
          setStatus("success");
          setMessage("Successfully connected to Spotify (Basic Access)! You can now search and add songs.");
          toast.success("Connected to Spotify!");
          
          // Redirect back to the main app after a short delay
          setTimeout(() => {
            navigate("/");
          }, 2000);
          return;
        }

        // Handle authorization code flow
        if (!code) {
          setStatus("error");
          setMessage("No authorization code or access token received");
          toast.error("Spotify connection failed");
          return;
        }

        // Exchange authorization code for access token using Firebase Function
        const response = await fetch(SPOTIFY_TOKEN_EXCHANGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            code,
            redirect_uri: window.location.origin + "/spotify/callback"
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to exchange authorization code");
        }

        const data = await response.json();
        
        // Store the access token and refresh token
        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
        localStorage.setItem("spotify_token_expires_at", 
          (Date.now() + data.expires_in * 1000).toString()
        );
        
        // Clear the authorization code since we now have tokens
        localStorage.removeItem("spotify_auth_code");
        localStorage.removeItem("spotify_auth_state");
        
        setStatus("success");
        setMessage("Successfully connected to Spotify! You can now search and add songs.");
        toast.success("Connected to Spotify!");
        
        // Redirect back to the main app after a short delay
        setTimeout(() => {
          navigate("/");
        }, 2000);

      } catch (error) {
        console.error("Spotify callback error:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to complete Spotify connection");
        toast.error("Spotify connection failed");
      }
    };

    handleCallback();
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-12 h-12 animate-spin text-blue-600" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case "error":
        return <XCircle className="w-12 h-12 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={getStatusColor()}>
            {status === "loading" && "Connecting to Spotify..."}
            {status === "success" && "Spotify Connected!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please wait while we complete your Spotify connection...
              </p>
            </div>
          )}
          
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You'll be redirected back to MixMate in a moment.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to MixMate
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Something went wrong while connecting to Spotify.
              </p>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Back to MixMate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
