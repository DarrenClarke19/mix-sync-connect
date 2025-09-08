import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/common/Layout/Header";
import { AuthModal } from "@/components/auth/AuthModal";
import { Music, Users, Plus } from "lucide-react";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
              <Music className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Create Collaborative Playlists
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              MixMate lets you build playlists with friends, combining songs from Spotify, YouTube Music, and more.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => setShowAuthModal(true)}>
              Get Started
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Collaborate</h3>
              <p className="text-sm text-muted-foreground">
                Invite friends to add songs and build playlists together
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Multiple Platforms</h3>
              <p className="text-sm text-muted-foreground">
                Combine songs from Spotify, YouTube Music, and more
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Export playlists to your favorite music platforms
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
