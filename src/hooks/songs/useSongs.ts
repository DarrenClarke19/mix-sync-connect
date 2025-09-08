import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { addSongToPlaylist as addSongToFirestore } from '@/services/firebase/playlistService';

export const useSongs = () => {
  const { addSongToPlaylist, removeSongFromPlaylist, likeSongInPlaylist } = usePlaylistStore();

  const addSong = async (playlistId: string, song: any) => {
    try {
      // Add to Firestore
      await addSongToFirestore(playlistId, song);
      
      // Add to store (the listener will also update, but this provides immediate feedback)
      addSongToPlaylist(playlistId, song);
    } catch (error) {
      console.error('Error adding song:', error);
      throw error;
    }
  };

  const removeSong = async (playlistId: string, songId: string) => {
    try {
      // Remove from store
      removeSongFromPlaylist(playlistId, songId);
      
      // TODO: Add Firestore removal
    } catch (error) {
      console.error('Error removing song:', error);
      throw error;
    }
  };

  const likeSong = async (playlistId: string, songId: string) => {
    try {
      // Update in store
      likeSongInPlaylist(playlistId, songId);
      
      // TODO: Add Firestore update
    } catch (error) {
      console.error('Error liking song:', error);
      throw error;
    }
  };

  return {
    addSong,
    removeSong,
    likeSong,
  };
};
