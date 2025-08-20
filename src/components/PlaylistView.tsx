import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SongItem } from "./SongItem";
import { YouTubeMusicSearch } from "./YouTubeMusicSearch";
import { SpotifySearch } from "./SpotifySearch";
import { ManualSongInput } from "./ManualSongInput";
import { ArrowLeft, Users, Download, Share2, Music, Plus, Youtube, Music2, ExternalLink, UserPlus, LogOut, Trash2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";
import { YouTubeMusicExportService } from "@/lib/youtubeMusicService";
import { SpotifyExportService } from "@/lib/spotifyExportService";
import { leavePlaylist } from "@/lib/playlistInviteService";
import { addSongToPlaylist as addSongToFirestore, deletePlaylist } from "@/lib/playlistService";
import { InviteFriendModal } from "./InviteFriendModal";

interface PlaylistViewProps {
  playlist: {
    id?: string;
    name: string;
    description?: string;
    ownerId: string;
    collaborators: string[];
          songs: Array<{
        id?: string;
        title: string;
        artist: string;
        album?: string;
        platform: string;
        platform_id?: string;
        addedBy: string;
        addedAt: Date;
        likes: number;
      }>;
    createdAt: Date;
    updatedAt: Date;
  };
  onBack: () => void;
  onAddSong: (song: { title: string; artist: string; platform: string;
    platform_id?: string; album?: string }) => void;
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
  console.log('PlaylistView render - playlistFromStore:', playlistFromStore);
  console.log('PlaylistView render - currentPlaylist:', currentPlaylist);

  // Update the store when the component mounts
  useEffect(() => {
    console.log('useEffect triggered - initialPlaylist.id:', initialPlaylist.id, 'currentPlaylist:', currentPlaylist);
    if (initialPlaylist.id && !currentPlaylist) {
      console.log('Setting current playlist in store:', initialPlaylist);
      usePlaylistStore.getState().setCurrentPlaylist(initialPlaylist);
    }
  }, [initialPlaylist.id, currentPlaylist, forceUpdate]);

  const handleAddSong = async (song: { title: string; artist: string; platform: string; platform_id?: string; album?: string }) => {
    console.log('handleAddSong called with playlist:', finalPlaylist);
    console.log('Playlist ID:', finalPlaylist.id);
    
    if (!finalPlaylist.id) {
      toast.error("Playlist not found");
      return;
    }

    try {
      const newSong = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: song.title,
        artist: song.artist,
        album: song.album,
        platform: song.platform,
        platform_id: song.platform_id,
        addedBy: user?.uid || 'unknown',
        addedAt: new Date(),
        likes: 0
      };

      // Add to Firestore first
      await addSongToFirestore(finalPlaylist.id, newSong);
      
      // Update the local store immediately for instant UI feedback
      console.log('Adding song to store:', newSong);
      console.log('Current playlist songs count:', finalPlaylist.songs.length);
      
      // Use the store's addSongToPlaylist function (this will trigger a re-render)
      addSongToStore(finalPlaylist.id, newSong);
      
      toast.success(`Added "${song.title}" to playlist`);
      setShowSongInput(false);
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      toast.error('Failed to add song to playlist. Please try again.');
    }
  };

  const handleExportToYouTube = async () => {
    if (!finalPlaylist.songs.length) {
      toast.error("No songs to export");
      return;
    }

    try {
      // For now, we'll use the basic export since YouTube Music doesn't have a public API
      // In the future, this could be enhanced with YouTube Data API v3 OAuth2
      const youtubeService = new YouTubeMusicExportService(import.meta.env.VITE_YOUTUBE_API_KEY || '');
      const success = await youtubeService.exportPlaylist(finalPlaylist.name, finalPlaylist.songs);
      
      if (success) {
        toast.success("Playlist exported to YouTube! Check your downloads for search links.");
      } else {
        toast.error("Failed to export playlist to YouTube");
      }
    } catch (error) {
      console.error("YouTube export error:", error);
      toast.error("Failed to export playlist to YouTube");
    }
  };

  const handleExportToSpotify = async () => {
    if (!finalPlaylist.songs.length) {
      toast.error("No songs to export");
      return;
    }

    // Check if user is connected to Spotify
    const spotifyToken = localStorage.getItem('spotify_access_token');
    if (!spotifyToken) {
      toast.error("Please connect to Spotify first to export playlists");
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
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Playlist link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing playlist:", error);
      toast.error("Failed to share playlist");
    }
  };

  const handleLeavePlaylist = async () => {
    if (!finalPlaylist.id || !user?.uid) {
      toast.error("Cannot leave playlist");
      return;
    }

    try {
      await leavePlaylist(finalPlaylist.id, user.uid);
      toast.success("Left playlist successfully");
      onBack(); // Go back to playlists list
    } catch (error) {
      console.error("Error leaving playlist:", error);
      toast.error("Failed to leave playlist");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!finalPlaylist.id || !user?.uid) {
      toast.error("Cannot delete playlist");
      return;
    }

    if (user.uid !== finalPlaylist.ownerId) {
      toast.error("Only the playlist owner can delete it");
      return;
    }

    try {
      // Delete from Firestore
      await deletePlaylist(finalPlaylist.id);
      
      // Remove from store
      usePlaylistStore.getState().removePlaylist(finalPlaylist.id);
      
      toast.success("Playlist deleted successfully");
      onBack(); // Go back to playlists list
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    }
  };

  const handleInviteFriends = () => {
    setShowInviteModal(true);
  };

    // Check if current user can invite friends (owner or collaborator)
  const canInviteFriends = user?.uid === finalPlaylist.ownerId || 
    finalPlaylist.collaborators.includes(user?.uid || '');
  
  // Check if current user can leave playlist (collaborator, not owner)
  const canLeavePlaylist = user?.uid !== finalPlaylist.ownerId && 
    finalPlaylist.collaborators.includes(user?.uid || '');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
                             <div>
                 <h1 className="text-2xl font-bold">{finalPlaylist.name}</h1>
                 {finalPlaylist.description && (
                   <p className="text-muted-foreground">{finalPlaylist.description}</p>
                 )}
               </div>
            </div>
            
            <div className="flex items-center gap-2">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <Users className="w-4 h-4" />
                 {finalPlaylist.collaborators.length + 1} collaborators
               </div>
               
               {canInviteFriends && (
                 <Button variant="outline" size="sm" onClick={handleInviteFriends}>
                   <UserPlus className="w-4 h-4 mr-2" />
                   Invite Friends
                 </Button>
               )}
               
               {canLeavePlaylist && (
                 <Button variant="outline" size="sm" onClick={handleLeavePlaylist}>
                   <LogOut className="w-4 h-4 mr-2" />
                   Leave Playlist
                 </Button>
               )}
               
               {user?.uid === finalPlaylist.ownerId && (
                 <Button 
                   variant="destructive" 
                   size="sm" 
                   onClick={() => setShowDeleteConfirm(true)}
                   className="bg-red-600 hover:bg-red-700"
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete Playlist
                 </Button>
               )}
               
               <Button variant="outline" size="sm" onClick={handleExportToYouTube}>
                 <Download className="w-4 h-4 mr-2" />
                 Export to YouTube
               </Button>
               <Button variant="outline" size="sm" onClick={handleExportToSpotify}>
                 <Download className="w-4 h-4 mr-2" />
                 Export to Spotify
               </Button>
               <Button variant="outline" size="sm" onClick={handleSharePlaylist}>
                 <Share2 className="w-4 h-4 mr-2" />
                 Share Playlist
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Song Input Section */}
        {showSongInput && (
          <Card className="mb-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSongInput(false)}
                  size="sm"
                >
                  Cancel
                </Button>
                <h3 className="text-lg font-medium">Add Songs</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YouTubeMusicSearch onAddSong={handleAddSong} />
                <SpotifySearch onAddSong={handleAddSong} />
                <ManualSongInput onAddSong={handleAddSong} />
              </div>
            </div>
          </Card>
        )}

        {/* Add Songs Button */}
        {!showSongInput && (
          <div className="mb-6">
            <Button
              onClick={() => setShowSongInput(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Songs
            </Button>
          </div>
        )}

                 {/* Songs List */}
         <div className="space-y-2">
           {finalPlaylist.songs.map((song, index) => (
             <SongItem
               key={song.id || index}
               song={song}
               onLike={() => onLikeSong(song.id || index.toString())}
               onRemove={() => onRemoveSong(song.id || index.toString())}
               canRemove={user?.uid === finalPlaylist.ownerId}
             />
           ))}
         </div>

                 {/* Empty State */}
         {finalPlaylist.songs.length === 0 && (
           <Card className="bg-gradient-card border border-border/50">
             <div className="p-8 text-center">
               <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
               <h3 className="text-lg font-medium text-foreground mb-2">No songs yet</h3>
               <p className="text-muted-foreground mb-4">
                 Start building your collaborative playlist by adding the first song!
               </p>
               <Button
                 onClick={() => setShowSongInput(true)}
                 className="flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" />
                 Add Songs
               </Button>
             </div>
           </Card>
         )}
      </div>

                    {/* Invite Friends Modal */}
       <InviteFriendModal
         isOpen={showInviteModal}
         onOpenChange={setShowInviteModal}
         playlistId={finalPlaylist.id || ''}
         playlistName={finalPlaylist.name}
         currentUserId={user?.uid || ''}
         currentUserEmail={user?.email || ''}
         currentUserDisplayName={profile?.displayName || ''}
       />

       {/* Delete Confirmation Dialog */}
       {showDeleteConfirm && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-card p-6 rounded-lg max-w-md mx-4">
             <h3 className="text-lg font-semibold mb-4">Delete Playlist</h3>
             <p className="text-muted-foreground mb-6">
               Are you sure you want to delete "{finalPlaylist.name}"? This action cannot be undone.
             </p>
             <div className="flex gap-3 justify-end">
               <Button
                 variant="outline"
                 onClick={() => setShowDeleteConfirm(false)}
               >
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={async () => {
                   setShowDeleteConfirm(false);
                   await handleDeletePlaylist();
                 }}
                 className="bg-red-600 hover:bg-red-700"
               >
                 Delete
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };