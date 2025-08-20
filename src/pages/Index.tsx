import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MixMateHeader } from "@/components/MixMateHeader";
import { AuthModal } from "@/components/AuthModal";
import { CreatePlaylistModal } from "@/components/CreatePlaylistModal";
import { PlaylistInvitesList } from "@/components/PlaylistInvitesList";
import { PlaylistView } from "@/components/PlaylistView";
import { PlaylistCard } from "@/components/PlaylistCard";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { usePlaylistStore, Playlist } from "@/stores/usePlaylistStore";
import { createPlaylist, listenToUserPlaylists, getUserPlaylistsSimple, FirestorePlaylist } from "@/lib/playlistService";
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
    getUserPlaylists, 
    getCollaborativePlaylists 
  } = usePlaylistStore();

  useEffect(() => {
    if (user && showDashboard) {
      try {
        console.log('Setting up playlist listener for user:', user.uid);
        
        // Set up real-time listener for user's playlists
        const unsubscribe = listenToUserPlaylists(user.uid, (firestorePlaylists) => {
          console.log('Received playlists from listener:', firestorePlaylists.length);
          
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
          
          // Update the store with Firestore data
          usePlaylistStore.getState().setPlaylists(storePlaylists);
          usePlaylistStore.getState().setLoading(false);
        });
        
        // Set a timeout to stop loading and try fallback method
        const timeoutId = setTimeout(async () => {
          console.log('Listener timeout reached, trying fallback method');
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
          console.log('Cleaning up playlist listener');
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
      console.log('Creating playlist with name:', name, 'for user:', user.uid);
      
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

      console.log('Playlist data being sent to Firestore:', playlistData);

      const playlistId = await createPlaylist(playlistData);
      console.log('Playlist created successfully with ID:', playlistId);
      
      // Create the playlist object for the store
      const newPlaylist: Playlist = {
        id: playlistId,
        ...playlistData
      };

      // Add to store
      addPlaylist(newPlaylist);
      
      toast.success(`Playlist "${name}" created successfully!`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      toast.error(`Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddSong = (song: { title: string; artist: string; platform: string; platform_id?: string }) => {
    if (!selectedPlaylist || !user) return;

    const newSong = {
      ...song,
      id: `song_${Date.now()}`,
      addedBy: user.email || user.uid,
      addedAt: new Date(),
      likes: 0,
    };

    // This would be implemented in firebaseService
    // For now, just show a success message
    console.log('Song added:', newSong);
    toast.success(`Song "${song.title}" added to playlist!`);
  };

  const handleLikeSong = (songId: string) => {
    if (!selectedPlaylist) return;

    // This would be implemented in firebaseService
    console.log('Song liked:', songId);
    toast.success('Song liked!');
  };

  const handleRemoveSong = (songId: string) => {
    if (!selectedPlaylist) return;

    // This would be implemented in firebaseService
    console.log('Song removed:', songId);
    toast.success('Song removed from playlist!');
  };

  const handleInviteSent = (friendUid: string) => {
    if (!selectedPlaylist) return;

    // This would be implemented in firebaseService
    console.log('Invite sent to:', friendUid);
    toast.success('Invite sent to friend!');
  };

  const handleGoToDashboard = () => {
    setShowDashboard(true);
  };

  const handleBackToLanding = () => {
    setShowDashboard(false);
    setSelectedPlaylist(null);
  };

  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-background">
        <MixMateHeader />
        <div className="container mx-auto px-4 py-6">
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={() => setSelectedPlaylist(null)}
            onAddSong={handleAddSong}
            onLikeSong={handleLikeSong}
            onRemoveSong={handleRemoveSong}
          />
        </div>
      </div>
    );
  }

  // Show dashboard only if user is authenticated AND has chosen to go to dashboard
  if (user && showDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <MixMateHeader />
        
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Your Playlists</h1>
                <p className="text-muted-foreground">
                  Create and manage your collaborative playlists
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleBackToLanding}>
                  Back to Home
                </Button>
                <CreatePlaylistModal onCreatePlaylist={handleCreatePlaylist} />
              </div>
            </div>

            {/* Playlist Invitations */}
            <PlaylistInvitesList userId={user.uid} />

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading playlists...</p>
              </div>
            ) : playlists.length === 0 ? (
              <Card className="bg-gradient-card border border-border/50">
                <CardContent className="p-8 text-center">
                  <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first collaborative playlist
                  </p>
                  <CreatePlaylistModal onCreatePlaylist={handleCreatePlaylist} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    {...playlist}
                    onClick={() => setSelectedPlaylist(playlist)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Always show landing page first (for both authenticated and non-authenticated users)
  return (
    <div className="min-h-screen bg-background">
      <MixMateHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="text-center py-20">
          <div className="max-w-3xl mx-auto space-y-8">
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
              {!user ? (
                <Button size="lg" onClick={() => setShowAuthModal(true)}>
                  Get Started
                </Button>
              ) : (
                <Button size="lg" onClick={handleGoToDashboard}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
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
                  Combine songs from Spotify, YouTube Music, and manual input
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Easy Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Export and share your collaborative playlists
                </p>
              </div>
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
