import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { router } from "./app/router";
import "./App.css";
import React from "react";

const queryClient = new QueryClient();

function App() {
  // Handle Spotify fallback OAuth redirect
  React.useEffect(() => {
    // Check if we have a Spotify access token in the URL hash
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        // Store the token
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_token_expires_at", 
          (Date.now() + 3600000).toString() // 1 hour default
        );
        
        // Clear the hash from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success message
        console.log("Spotify connected successfully via fallback method!");
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
