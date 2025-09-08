import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreatePlaylistModal } from "@/components/modals/CreatePlaylistModal";
import { PlaylistInvitesList } from "@/components/friends/PlaylistInvitesList";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { SpotifyConnectButton } from "@/components/SpotifyConnectButton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { usePlaylists } from "@/hooks/playlists/usePlaylists";
import { Plus, Music } from "lucide-react";

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useFirebaseAuth();
  const { playlists, isLoading, createPlaylist } = usePlaylists();

  const handleCreatePlaylist = async (name: string) => {
    if (!user) return;
    
    try {
      await createPlaylist({
        name,
        description: null,
        ownerId: user.uid,
        collaborators: [user.uid],
        songs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Playlists</h1>
            <p className="text-muted-foreground">Create and manage collaborative playlists</p>
          </div>
          <div className="flex items-center gap-4">
            <SpotifyConnectButton />
            <CreatePlaylistModal 
              onCreatePlaylist={handleCreatePlaylist}
              trigger={
                <Button variant="gradient" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Playlist
                </Button>
              }
            />
          </div>
        </div>

        {/* Playlist Invites */}
        <PlaylistInvitesList userId={user?.uid || ''} />

        {/* Playlists Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gradient-card border border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <Card className="bg-gradient-card border border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Music className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first collaborative playlist to get started
              </p>
              <CreatePlaylistModal 
                onCreatePlaylist={handleCreatePlaylist}
                trigger={
                  <Button variant="gradient" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Playlist
                  </Button>
                }
              />
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
    </div>
  );
}
