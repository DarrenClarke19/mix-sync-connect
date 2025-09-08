import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MixMateHeader } from "@/components/MixMateHeader";
import { AuthModal } from "@/components/auth/AuthModal";
import { CreatePlaylistModal } from "@/components/modals/CreatePlaylistModal";
import { PlaylistInvitesList } from "@/components/friends/PlaylistInvitesList";
import { PlaylistView } from "@/components/playlists/PlaylistView";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { usePlaylistStore, Playlist } from "@/stores/usePlaylistStore";
import { createPlaylist, listenToUserPlaylists, getUserPlaylistsSimple, FirestorePlaylist } from "@/services/firebase/playlistService";
import { Music, Plus, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const { user } = useFirebaseAuth();
  const { 
    playlists, 
    isLoading, 
    addPlaylist,
    syncPlaylist,
    getUserPlaylists, 
    getCollaborativePlaylists 
  } = usePlaylistStore();

  useEffect(() => {
    if (user && showDashboard) {
      try {
        // Set up real-time listener for user's playlists
        const unsubscribe = listenToUserPlaylists(user.uid, (firestorePlaylists) => {
          // Convert Firestore playlists to store format
          const storePlaylists: Playlist[] = firestorePlaylists.map(fp => ({
            id: fp.id,
            name: fp.name,
            description: fp.description,
            ownerId: fp.ownerId,
            collaborators: fp.collaborators,
            songs: fp.songs,
            createdAt: fp.createdAt,
            updatedAt: fp.updatedAt
          }));
          
          // Set playlists directly from Firestore (single source of truth)
          // This replaces the entire array, preventing duplicates
          usePlaylistStore.getState().setPlaylists(storePlaylists);
          
          usePlaylistStore.getState().setLoading(false);
        });
        
        // Set a timeout to stop loading and try fallback method
        const timeoutId = setTimeout(async () => {
          try {
            const fallbackPlaylists = await getUserPlaylistsSimple(user.uid);
            const storePlaylists: Playlist[] = fallbackPlaylists.map(fp => ({
              id: fp.id,
              name: fp.name,
              description: fp.description,
              ownerId: fp.ownerId,
              collaborators: fp.collaborators,
              songs: fp.songs,
              createdAt: fp.createdAt,
              updatedAt: fp.updatedAt
            }));
            
            usePlaylistStore.getState().setPlaylists(storePlaylists);
            usePlaylistStore.getState().setLoading(false);
          } catch (fallbackError) {
            console.error('Fallback method also failed:', fallbackError);
            usePlaylistStore.getState().setLoading(false);
          }
        }, 10000); // Increased timeout to 10 seconds
        
        return () => {
          unsubscribe();
          clearTimeout(timeoutId);
        };
      } catch (error) {
        console.error('Error setting up playlist listener:', error);
        // Try fallback method immediately
        getUserPlaylistsSimple(user.uid).then(fallbackPlaylists => {
          const storePlaylists: Playlist[] = fallbackPlaylists.map(fp => ({
            id: fp.id,
            name: fp.name,
            description: fp.description,
            ownerId: fp.ownerId,
            collaborators: fp.collaborators,
            songs: fp.songs,
            createdAt: fp.createdAt,
            updatedAt: fp.updatedAt
          }));
          
          usePlaylistStore.getState().setPlaylists(storePlaylists);
          usePlaylistStore.getState().setLoading(false);
        }).catch(fallbackError => {
          console.error('Fallback method also failed:', fallbackError);
          usePlaylistStore.getState().setLoading(false);
        });
      }
    }
  }, [user, showDashboard]);

  const handleCreatePlaylist = async (name: string) => {
    if (!user) return;

    try {
      // Create playlist in Firestore
      const playlistData = {
        name,
        description: null, // Explicitly set description to null to avoid undefined
        ownerId: user.uid,
        collaborators: [user.uid],
        songs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const playlistId = await createPlaylist(playlistData);
      
      // Don't add to store here - the Firestore listener will handle it
      // This prevents duplication
      toast.success(`Playlist "${name}" created successfully!`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error("Failed to create playlist");
    }
  };

  const handleGoToDashboard = () => {
    setShowDashboard(true);
  };

  const handleBackToHome = () => {
    setShowDashboard(false);
    setSelectedPlaylist(null);
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleAddSong = (song: { title: string; artist: string; platform: string; platform_id?: string; album?: string }) => {
    if (selectedPlaylist) {
      const newSong = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: song.title,
        artist: song.artist,
        album: song.album || "Unknown Album",
        platform: song.platform,
        platform_id: song.platform_id,
        addedBy: user?.uid || "unknown",
        addedAt: new Date(),
        likes: 0,
      };
      
      // Update store (single source of truth)
      usePlaylistStore.getState().addSongToPlaylist(selectedPlaylist.id!, newSong);
      
      // Update selected playlist in local state
      const updatedPlaylist = {
        ...selectedPlaylist,
        songs: [...selectedPlaylist.songs, newSong],
      };
      setSelectedPlaylist(updatedPlaylist);
      
      toast.success(`"${song.title}" added to playlist!`);
    }
  };

  const handleLikeSong = (songId: string) => {
    if (selectedPlaylist) {
      usePlaylistStore.getState().likeSongInPlaylist(selectedPlaylist.id!, songId);
      
      // Update selected playlist in local state
      const updatedPlaylist = {
        ...selectedPlaylist,
        songs: selectedPlaylist.songs.map(song => 
          song.id === songId ? { ...song, likes: song.likes + 1 } : song
        ),
      };
      setSelectedPlaylist(updatedPlaylist);
    }
  };

  const handleRemoveSong = (songId: string) => {
    if (selectedPlaylist) {
      usePlaylistStore.getState().removeSongFromPlaylist(selectedPlaylist.id!, songId);
      
      // Update selected playlist in local state
      const updatedPlaylist = {
        ...selectedPlaylist,
        songs: selectedPlaylist.songs.filter(song => song.id !== songId),
      };
      setSelectedPlaylist(updatedPlaylist);
      
      toast.success("Song removed from playlist");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <MixMateHeader />
        
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
        />
      </div>
    );
  }

  if (!showDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <MixMateHeader />
        
        <main className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                <Music className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to MixMate
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ready to create collaborative playlists with your friends?
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={handleGoToDashboard}>
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <MixMateHeader />
        <PlaylistView
          playlist={selectedPlaylist}
          onBack={handleBackToHome}
          onAddSong={handleAddSong}
          onLikeSong={handleLikeSong}
          onRemoveSong={handleRemoveSong}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <MixMateHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Playlists</h1>
            <p className="text-muted-foreground">Create and manage collaborative playlists</p>
          </div>
          <CreatePlaylistModal onCreatePlaylist={handleCreatePlaylist} />
        </div>

        {/* Playlist Invites */}
        <PlaylistInvitesList userId={user.uid} />

        {/* Playlists Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gradient-card border border-border/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <Card className="bg-gradient-card border border-border/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Music className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first collaborative playlist to get started
              </p>
              <CreatePlaylistModal onCreatePlaylist={handleCreatePlaylist} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}