import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SongItem } from "@/components/songs/SongItem";
import { UnifiedSongSearch } from "@/components/songs/UnifiedSongSearch";
import { ArrowLeft, Users, Download, Share2, Music, Plus, ExternalLink, UserPlus, LogOut, Trash2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";
import { SpotifyExportService } from "@/services/external/spotifyExportService";
import { leavePlaylist } from "@/services/firebase/playlistInviteService";
import { addSongToPlaylist as addSongToFirestore, deletePlaylist } from "@/services/firebase/playlistService";
import { InviteFriendModal } from "@/components/friends/InviteFriendModal";
import { Playlist } from "@/types/playlist";

interface PlaylistViewProps {
  playlist: Playlist;
  onBack: () => void;
  onAddSong: (song: { title: string; artist: string; platform: string; platform_id?: string; album?: string }) => void;
  onLikeSong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
}

export const PlaylistView = ({ 
  playlist: initialPlaylist, 
  onBack, 
  onAddSong, 
  onLikeSong, 
  onRemoveSong 
}: PlaylistViewProps) => {
  const [showSongInput, setShowSongInput] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { user } = useFirebaseAuth();
  const { currentPlaylist, addSongToPlaylist: addSongToStore, updatePlaylist } = usePlaylistStore();
  const { profile } = useUserStore();
  
  // Use the store playlist if available, otherwise use the prop
  // Subscribe directly to the store to ensure re-renders
  const storePlaylist = usePlaylistStore(state => state.currentPlaylist);
  const storePlaylists = usePlaylistStore(state => state.playlists);
  const playlist = storePlaylist || currentPlaylist || initialPlaylist;
  
  // Also subscribe to the specific playlist from the playlists array
  const playlistFromStore = storePlaylists.find(p => p.id === (storePlaylist?.id || currentPlaylist?.id || initialPlaylist?.id));
  const finalPlaylist = playlistFromStore || playlist;
  
  // Debug: Check playlist IDs
  console.log('PlaylistView render - initialPlaylist.id:', initialPlaylist.id);
  console.log('PlaylistView render - currentPlaylist.id:', currentPlaylist?.id);
  console.log('PlaylistView render - storePlaylist.id:', storePlaylist?.id);
  console.log('PlaylistView render - playlistFromStore.id:', playlistFromStore?.id);
  console.log('PlaylistView render - finalPlaylist.id:', finalPlaylist?.id);
  
  // Debug: Log playlist data for debugging
  console.log('PlaylistView render - finalPlaylist:', finalPlaylist);
  console.log('PlaylistView render - songs count:', finalPlaylist.songs.length);
  console.log('PlaylistView render - storePlaylist:', storePlaylist);
  
  // Update current playlist in store when component mounts or playlist changes
  useEffect(() => {
    if (finalPlaylist && finalPlaylist.id) {
      console.log('Setting current playlist in store:', finalPlaylist.id);
      usePlaylistStore.getState().setCurrentPlaylist(finalPlaylist);
    }
  }, [finalPlaylist?.id]);

  const handleExportToSpotify = async () => {
    if (!user) {
      toast.error("Please sign in to export playlists");
      return;
    }

    // Get Spotify access token
    const spotifyToken = localStorage.getItem("spotify_access_token");
    if (!spotifyToken) {
      toast.error("Please connect your Spotify account first");
      return;
    }

    try {
      const spotifyService = new SpotifyExportService(spotifyToken);
      const result = await spotifyService.exportPlaylist(finalPlaylist.name, finalPlaylist.songs);
      
      if (result.success) {
        toast.success(result.message);
        if (result.playlistUrl) {
          // Show a toast with a link to the created playlist
          toast.success(
            <div className="flex items-center gap-2">
              <span>Playlist created on Spotify!</span>
              <a 
                href={result.playlistUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Open Playlist <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>
          );
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Spotify export error:", error);
      toast.error("Failed to export playlist to Spotify");
    }
  };

  const handleSharePlaylist = async () => {
    try {
      const shareData = {
        title: finalPlaylist.name,
        text: `Check out this playlist: ${finalPlaylist.name}`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Playlist link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share playlist");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!finalPlaylist.id) return;

    try {
      await deletePlaylist(finalPlaylist.id);
      toast.success("Playlist deleted successfully");
      onBack();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete playlist");
    }
  };

  const handleLeavePlaylist = async () => {
    if (!finalPlaylist.id || !user) return;

    try {
      await leavePlaylist(finalPlaylist.id, user.uid);
      toast.success("Left playlist successfully");
      onBack();
    } catch (error) {
      console.error("Leave error:", error);
      toast.error("Failed to leave playlist");
    }
  };

  const isOwner = user?.uid === finalPlaylist.ownerId;
  const isCollaborator = finalPlaylist.collaborators.includes(user?.uid || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{finalPlaylist.name}</h1>
            {finalPlaylist.description && (
              <p className="text-muted-foreground mt-1">{finalPlaylist.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSharePlaylist}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button variant="outline" onClick={handleExportToSpotify}>
            <Download className="w-4 h-4 mr-2" />
            Export to Spotify
          </Button>

          {isOwner && (
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
          )}

          {isOwner ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleLeavePlaylist}>
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* Playlist Info */}
      <Card className="bg-gradient-card border border-border/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Music className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{finalPlaylist.songs.length} Songs</h2>
                <p className="text-muted-foreground">
                  Created {new Date(finalPlaylist.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {(isOwner || isCollaborator) && (
              <Button 
                variant="gradient" 
                onClick={() => setShowSongInput(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Songs
              </Button>
            )}
          </div>

          {/* Collaborators */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Collaborators:</span>
            <div className="flex -space-x-2">
              {finalPlaylist.collaborators.slice(0, 3).map((collaboratorId, index) => (
                <Avatar key={collaboratorId} className="w-6 h-6 border-2 border-background">
                  <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                    {collaboratorId.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {finalPlaylist.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{finalPlaylist.collaborators.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Songs List */}
      <div className="space-y-2">
        {finalPlaylist.songs.length === 0 ? (
          <Card className="bg-gradient-card border border-border/50">
            <div className="p-8 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No songs yet</h3>
              <p className="text-muted-foreground mb-4">
                Add some songs to get started with your playlist
              </p>
              {(isOwner || isCollaborator) && (
                <Button 
                  variant="gradient" 
                  onClick={() => setShowSongInput(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Song
                </Button>
              )}
            </div>
          </Card>
        ) : (
          finalPlaylist.songs.map((song, index) => (
            <SongItem
              key={song.id || index}
              song={song}
              onLike={() => onLikeSong(song.id!)}
              onRemove={() => onRemoveSong(song.id!)}
              canRemove={isOwner || isCollaborator}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <UnifiedSongSearch
        isOpen={showSongInput}
        onClose={() => setShowSongInput(false)}
        onAddSong={onAddSong}
        playlistName={finalPlaylist.name}
      />

      <InviteFriendModal
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
        playlistId={finalPlaylist.id!}
        playlistName={finalPlaylist.name}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border border-border/50 p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete Playlist</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{finalPlaylist.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePlaylist}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
