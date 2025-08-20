import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Playlist {
  id?: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: string[];
  songs: Song[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Song {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  platform: string;
  platformId?: string;
  addedBy: string;
  addedAt: Date;
  likes: number;
}

// Playlist operations
export const createPlaylist = async (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'playlists'), {
      ...playlist,
      createdAt: now,
      updatedAt: now,
    });
    return { 
      id: docRef.id, 
      ...playlist, 
      createdAt: now, 
      updatedAt: now 
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

export const getUserPlaylists = (userId: string, callback: (playlists: Playlist[]) => void) => {
  const q = query(
    collection(db, 'playlists'),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const playlists: Playlist[] = [];
    querySnapshot.forEach((doc) => {
      playlists.push({ id: doc.id, ...doc.data() } as Playlist);
    });
    callback(playlists);
  });
};

export const addSongToPlaylist = async (playlistId: string, song: Omit<Song, 'id' | 'addedAt'>) => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    const newSong = {
      ...song,
      addedAt: new Date(),
    };
    
    await updateDoc(playlistRef, {
      songs: [...(await getPlaylistSongs(playlistId)), newSong],
      updatedAt: new Date(),
    });
    
    return newSong;
  } catch (error) {
    console.error('Error adding song:', error);
    throw error;
  }
};

export const getPlaylistSongs = async (playlistId: string): Promise<Song[]> => {
  try {
    const playlistDoc = await getDocs(query(collection(db, 'playlists'), where('id', '==', playlistId)));
    if (!playlistDoc.empty) {
      return playlistDoc.docs[0].data().songs || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting playlist songs:', error);
    return [];
  }
};

export const updatePlaylist = async (playlistId: string, updates: Partial<Playlist>) => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    await updateDoc(playlistRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

export const deletePlaylist = async (playlistId: string) => {
  try {
    await deleteDoc(doc(db, 'playlists', playlistId));
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};
