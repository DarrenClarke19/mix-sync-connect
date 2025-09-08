import { useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { createPlaylist, listenToUserPlaylists, getUserPlaylistsSimple } from '@/services/firebase/playlistService';
import { Playlist } from '@/types/playlist';

export const usePlaylists = () => {
  const { user } = useFirebaseAuth();
  const { 
    playlists, 
    isLoading, 
    setPlaylists,
    setLoading 
  } = usePlaylistStore();

  useEffect(() => {
    if (user) {
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
          setPlaylists(storePlaylists);
          setLoading(false);
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
            
            setPlaylists(storePlaylists);
            setLoading(false);
          } catch (fallbackError) {
            console.error('Fallback method also failed:', fallbackError);
            setLoading(false);
          }
        }, 10000);
        
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
          
          setPlaylists(storePlaylists);
          setLoading(false);
        }).catch(fallbackError => {
          console.error('Fallback method also failed:', fallbackError);
          setLoading(false);
        });
      }
    }
  }, [user, setPlaylists, setLoading]);

  const createNewPlaylist = async (playlistData: Omit<Playlist, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const playlistId = await createPlaylist(playlistData);
      return playlistId;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  };

  const getPlaylistById = (playlistId: string) => {
    return playlists.find(p => p.id === playlistId);
  };

  return {
    playlists,
    isLoading,
    createPlaylist: createNewPlaylist,
    getPlaylistById,
  };
};
