import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface FirestorePlaylist {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  collaborators: string[];
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    album?: string | null;
    platform: string;
    platform_id?: string | null;
    addedBy: string;
    addedAt: Date;
    likes: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new playlist in Firestore
 */
export const createPlaylist = async (playlist: Omit<FirestorePlaylist, 'id'>): Promise<string> => {
  let playlistId: string;
  let cleanPlaylist: any;
  let firestoreData: any;
  
  try {
    console.log('createPlaylist called with data:', playlist);
    
    // First, let's test if we can write to Firestore at all
    console.log('Testing Firestore connection...');
    const testRef = doc(db, 'test', 'connection-test');
    try {
      await setDoc(testRef, { test: true, timestamp: new Date() });
      console.log('✅ Firestore connection test successful');
      // Clean up test document
      await deleteDoc(testRef);
    } catch (testError) {
      console.error('❌ Firestore connection test failed:', testError);
      throw new Error('Firestore connection failed - cannot create playlist');
    }
    
    playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const playlistRef = doc(db, 'playlists', playlistId);
    
    // Filter out undefined values to prevent Firestore errors
    cleanPlaylist = Object.fromEntries(
      Object.entries(playlist).filter(([_, value]) => value !== undefined)
    );
    
    console.log('Clean playlist data (after filtering undefined):', cleanPlaylist);
    console.log('Final playlist data being sent to Firestore:', {
      ...cleanPlaylist,
      id: playlistId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Try to create the playlists collection by writing the first document
    console.log('Attempting to create playlists collection with first document...');
    
    // Convert Date objects to Firestore Timestamps
    firestoreData = {
      ...cleanPlaylist,
      id: playlistId,
      createdAt: new Date().toISOString(), // Convert to ISO string
      updatedAt: new Date().toISOString()  // Convert to ISO string
    };
    
    console.log('Final data with ISO dates:', firestoreData);
    
    await setDoc(playlistRef, firestoreData);
    
    console.log('✅ Playlist document successfully written to Firestore');
    console.log('✅ Playlists collection created successfully');
    return playlistId;
  } catch (error) {
    console.error('❌ Error creating playlist:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a Firestore-specific error
    if (error && typeof error === 'object') {
      console.error('Error object keys:', Object.keys(error));
      console.error('Error object:', JSON.stringify(error, null, 2));
      
      if ('code' in error) {
        console.error('Firestore error code:', (error as any).code);
      }
      if ('message' in error) {
        console.error('Firestore error message:', (error as any).message);
      }
      if ('details' in error) {
        console.error('Firestore error details:', (error as any).details);
      }
    }
    
    // Log the exact data that was being sent (if available)
    if (cleanPlaylist && playlistId) {
      console.error('Data that failed to write:', {
        ...cleanPlaylist,
        id: playlistId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    throw new Error(`Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update a playlist in Firestore
 */
export const updatePlaylist = async (playlistId: string, updates: Partial<FirestorePlaylist>): Promise<void> => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    await updateDoc(playlistRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw new Error('Failed to update playlist');
  }
};

/**
 * Delete a playlist from Firestore
 */
export const deletePlaylist = async (playlistId: string): Promise<void> => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    await deleteDoc(playlistRef);
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw new Error('Failed to delete playlist');
  }
};

/**
 * Get a playlist by ID
 */
export const getPlaylistById = async (playlistId: string): Promise<FirestorePlaylist | null> => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    const playlistDoc = await getDoc(playlistRef);
    
    if (playlistDoc.exists()) {
      return {
        ...playlistDoc.data(),
        id: playlistDoc.id
      } as FirestorePlaylist;
    }
    return null;
  } catch (error) {
    console.error('Error getting playlist:', error);
    throw new Error('Failed to get playlist');
  }
};

/**
 * Get all playlists owned by a user
 */
export const getUserPlaylists = async (userId: string): Promise<FirestorePlaylist[]> => {
  try {
    const q = query(
      collection(db, 'playlists'),
      where('ownerId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const playlists = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }) as FirestorePlaylist);
    
    // Sort in memory instead of using orderBy
    return playlists.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting user playlists:', error);
    throw new Error('Failed to get user playlists');
  }
};

/**
 * Get all playlists where user is a collaborator
 */
export const getCollaborativePlaylists = async (userId: string): Promise<FirestorePlaylist[]> => {
  try {
    const q = query(
      collection(db, 'playlists'),
      where('collaborators', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const playlists = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }) as FirestorePlaylist);
    
    // Sort in memory instead of using orderBy
    return playlists.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting collaborative playlists:', error);
    throw new Error('Failed to get collaborative playlists');
  }
};

/**
 * Get all playlists for a user (owned + collaborative)
 */
export const getAllUserPlaylists = async (userId: string): Promise<FirestorePlaylist[]> => {
  try {
    const [ownedPlaylists, collaborativePlaylists] = await Promise.all([
      getUserPlaylists(userId),
      getCollaborativePlaylists(userId)
    ]);
    
    // Combine and deduplicate
    const allPlaylists = [...ownedPlaylists, ...collaborativePlaylists];
    const uniquePlaylists = allPlaylists.filter((playlist, index, self) => 
      index === self.findIndex(p => p.id === playlist.id)
    );
    
    // Sort by updatedAt descending
    return uniquePlaylists.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting all user playlists:', error);
    throw new Error('Failed to get user playlists');
  }
};

/**
 * Listen to all playlists for a user
 */
export const listenToUserPlaylists = (
  userId: string,
  callback: (playlists: FirestorePlaylist[]) => void
) => {
  try {
    console.log('Setting up playlist listener for user:', userId);
    
    // Listen to owned playlists
    const ownedQuery = query(
      collection(db, 'playlists'),
      where('ownerId', '==', userId)
    );
    
    // Listen to collaborative playlists
    const collaborativeQuery = query(
      collection(db, 'playlists'),
      where('collaborators', 'array-contains', userId)
    );
    
    const unsubscribeOwned = onSnapshot(ownedQuery, 
      (ownedSnapshot) => {
        console.log('Owned playlists snapshot received:', ownedSnapshot.docs.length, 'docs');
        const ownedPlaylists = ownedSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }) as FirestorePlaylist);
        
        // Get collaborative playlists
        getDocs(collaborativeQuery).then((collaborativeSnapshot) => {
          console.log('Collaborative playlists snapshot received:', collaborativeSnapshot.docs.length, 'docs');
          const collaborativePlaylists = collaborativeSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          }) as FirestorePlaylist);
          
          // Combine and deduplicate
          const allPlaylists = [...ownedPlaylists, ...collaborativePlaylists];
          const uniquePlaylists = allPlaylists.filter((playlist, index, self) => 
            index === self.findIndex(p => p.id === playlist.id)
          );
          
          // Sort by updatedAt descending
          const sortedPlaylists = uniquePlaylists.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          console.log('Total playlists after combining:', sortedPlaylists.length);
          callback(sortedPlaylists);
        }).catch((error) => {
          console.error('Error getting collaborative playlists:', error);
          // Still return owned playlists if collaborative query fails
          callback(ownedPlaylists);
        });
      },
      (error) => {
        console.error('Error in owned playlists listener:', error);
        // Try to get playlists without real-time updates
        getAllUserPlaylists(userId).then(callback).catch((fallbackError) => {
          console.error('Fallback playlist fetch also failed:', fallbackError);
          callback([]);
        });
      }
    );
    
    return unsubscribeOwned;
  } catch (error) {
    console.error('Error setting up playlist listener:', error);
    // Return a no-op function if there's an error
    return () => {};
  }
};

/**
 * Simple function to get user playlists without real-time updates
 * Use this as a fallback if the listener fails
 */
export const getUserPlaylistsSimple = async (userId: string): Promise<FirestorePlaylist[]> => {
  try {
    console.log('Getting user playlists (simple method) for user:', userId);
    const playlists = await getAllUserPlaylists(userId);
    console.log('Retrieved playlists (simple method):', playlists.length);
    return playlists;
  } catch (error) {
    console.error('Error getting user playlists (simple method):', error);
    return [];
  }
};

/**
 * Add a song to a playlist
 */
export const addSongToPlaylist = async (
  playlistId: string, 
  song: FirestorePlaylist['songs'][0]
): Promise<void> => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    const playlistDoc = await getDoc(playlistRef);
    
    if (!playlistDoc.exists()) {
      throw new Error('Playlist not found');
    }
    
    const playlist = playlistDoc.data() as FirestorePlaylist;
    
    // Filter out undefined values to prevent Firestore errors
    const cleanSong = Object.fromEntries(
      Object.entries(song).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(playlistRef, {
      songs: [...playlist.songs, cleanSong],
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw new Error('Failed to add song to playlist');
  }
};

/**
 * Remove a song from a playlist
 */
export const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<void> => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    const playlistDoc = await getDoc(playlistRef);
    
    if (!playlistDoc.exists()) {
      throw new Error('Playlist not found');
    }
    
    const playlist = playlistDoc.data() as FirestorePlaylist;
    const updatedSongs = playlist.songs.filter(song => song.id !== songId);
    
    await updateDoc(playlistRef, {
      songs: updatedSongs,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    throw new Error('Failed to remove song from playlist');
  }
};
