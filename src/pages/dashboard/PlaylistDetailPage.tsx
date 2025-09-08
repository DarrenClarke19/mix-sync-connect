import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlaylistView } from "@/components/playlists/PlaylistView";
import { usePlaylists } from "@/hooks/playlists/usePlaylists";
import { useSongs } from "@/hooks/songs/useSongs";
import { toast } from "sonner";

export default function PlaylistDetailPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { getPlaylistById } = usePlaylists();
  const { addSong, removeSong, likeSong } = useSongs();

  const playlist = playlistId ? getPlaylistById(playlistId) : null;

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleAddSong = async (song: any) => {
    if (!playlistId) return;
    
    try {
      await addSong(playlistId, song);
      toast.success(`"${song.title}" added to playlist!`);
    } catch (error) {
      console.error('Error adding song:', error);
      toast.error("Failed to add song");
    }
  };

  const handleLikeSong = async (songId: string) => {
    if (!playlistId) return;
    
    try {
      await likeSong(playlistId, songId);
    } catch (error) {
      console.error('Error liking song:', error);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlistId) return;
    
    try {
      await removeSong(playlistId, songId);
      toast.success("Song removed from playlist");
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error("Failed to remove song");
    }
  };

  if (!playlist) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Playlist not found</h1>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <PlaylistView
      playlist={playlist}
      onBack={handleBack}
      onAddSong={handleAddSong}
      onLikeSong={handleLikeSong}
      onRemoveSong={handleRemoveSong}
    />
  );
}
