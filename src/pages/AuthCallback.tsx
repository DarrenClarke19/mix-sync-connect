import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Music } from "lucide-react";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authentication was cancelled or failed');
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        return;
      }

      try {
        // Get the stored redirect URI
        const redirectUri = localStorage.getItem('spotify_redirect_uri') || 
          import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 
          'http://localhost:5173/auth/callback';

        // Call our Supabase function to exchange the code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke('spotify-auth', {
          body: {
            action: 'exchange_code',
            code,
            redirect_uri: redirectUri,
          },
        });

        if (exchangeError) {
          throw new Error(exchangeError.message);
        }

        if (data?.success) {
          setStatus('success');
          setMessage('Spotify connected successfully!');
          
          // Close the popup window if this is opened in one
          if (window.opener) {
            window.opener.postMessage({ type: 'SPOTIFY_CONNECTED' }, '*');
            window.close();
          } else {
            // Navigate back to the main app
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        } else {
          throw new Error('Failed to exchange authorization code');
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateProfile]);

  const handleRetry = () => {
    setStatus('loading');
    setMessage('');
    // Reload the page to retry
    window.location.reload();
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Connecting to Spotify</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Completing authentication...'}
            {status === 'success' && 'Authentication successful!'}
            {status === 'error' && 'Authentication failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Please wait while we complete the connection...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-green-600 font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">
                You can now close this window and return to MixMate
              </p>
              <Button onClick={handleClose} className="w-full">
                Return to MixMate
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600 font-medium">{message}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleClose} className="w-full">
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
