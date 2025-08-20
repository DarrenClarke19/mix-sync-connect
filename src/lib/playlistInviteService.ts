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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface PlaylistInvite {
  id: string;
  playlistId: string;
  playlistName: string;
  fromUid: string;
  fromEmail: string;
  fromDisplayName?: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

/**
 * Send a playlist invitation
 */
export const sendPlaylistInvite = async (
  playlistId: string,
  playlistName: string,
  fromUid: string,
  fromEmail: string,
  fromDisplayName: string,
  toUid: string
): Promise<string> => {
  try {
    const inviteId = `${playlistId}_${toUid}_${Date.now()}`;
    const invite: PlaylistInvite = {
      id: inviteId,
      playlistId,
      playlistName,
      fromUid,
      fromEmail,
      fromDisplayName,
      toUid,
      status: 'pending',
      createdAt: new Date()
    };

    await setDoc(doc(db, 'playlistInvites', inviteId), invite);
    return inviteId;
  } catch (error) {
    console.error('Error sending playlist invite:', error);
    throw new Error('Failed to send playlist invitation');
  }
};

/**
 * Accept a playlist invitation
 */
export const acceptPlaylistInvite = async (inviteId: string): Promise<void> => {
  try {
    const inviteRef = doc(db, 'playlistInvites', inviteId);
    const inviteDoc = await getDoc(inviteRef);
    
    if (!inviteDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invite = inviteDoc.data() as PlaylistInvite;
    
    // Update invite status
    await updateDoc(inviteRef, { status: 'accepted' });
    
    // Add user as collaborator to playlist
    const playlistRef = doc(db, 'playlists', invite.playlistId);
    const playlistDoc = await getDoc(playlistRef);
    
    if (playlistDoc.exists()) {
      const playlist = playlistDoc.data();
      const collaborators = playlist.collaborators || [];
      
      if (!collaborators.includes(invite.toUid)) {
        await updateDoc(playlistRef, {
          collaborators: [...collaborators, invite.toUid]
        });
      }
    }
  } catch (error) {
    console.error('Error accepting playlist invite:', error);
    throw new Error('Failed to accept playlist invitation');
  }
};

/**
 * Reject a playlist invitation
 */
export const rejectPlaylistInvite = async (inviteId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'playlistInvites', inviteId), { 
      status: 'rejected' 
    });
  } catch (error) {
    console.error('Error rejecting playlist invite:', error);
    throw new Error('Failed to reject playlist invitation');
  }
};

/**
 * Remove a collaborator from a playlist
 */
export const removeCollaborator = async (
  playlistId: string, 
  collaboratorUid: string
): Promise<void> => {
  try {
    const playlistRef = doc(db, 'playlists', playlistId);
    const playlistDoc = await getDoc(playlistRef);
    
    if (playlistDoc.exists()) {
      const playlist = playlistDoc.data();
      const collaborators = playlist.collaborators || [];
      
      const updatedCollaborators = collaborators.filter(
        (uid: string) => uid !== collaboratorUid
      );
      
      await updateDoc(playlistRef, {
        collaborators: updatedCollaborators
      });
    }
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw new Error('Failed to remove collaborator');
  }
};

/**
 * Leave a playlist (remove yourself as collaborator)
 */
export const leavePlaylist = async (
  playlistId: string, 
  userId: string
): Promise<void> => {
  try {
    await removeCollaborator(playlistId, userId);
  } catch (error) {
    console.error('Error leaving playlist:', error);
    throw new Error('Failed to leave playlist');
  }
};

/**
 * Get pending invitations for a user
 */
export const getPendingInvites = async (userId: string): Promise<PlaylistInvite[]> => {
  try {
    const q = query(
      collection(db, 'playlistInvites'),
      where('toUid', '==', userId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as PlaylistInvite);
  } catch (error) {
    console.error('Error getting pending invites:', error);
    throw new Error('Failed to get pending invitations');
  }
};

/**
 * Get sent invitations by a user
 */
export const getSentInvites = async (userId: string): Promise<PlaylistInvite[]> => {
  try {
    const q = query(
      collection(db, 'playlistInvites'),
      where('fromUid', '==', userId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as PlaylistInvite);
  } catch (error) {
    console.error('Error getting sent invites:', error);
    throw new Error('Failed to get sent invitations');
  }
};

/**
 * Listen to pending invitations for a user
 */
export const listenToPendingInvites = (
  userId: string,
  callback: (invites: PlaylistInvite[]) => void
) => {
  const q = query(
    collection(db, 'playlistInvites'),
    where('toUid', '==', userId),
    where('status', '==', 'pending')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const invites = querySnapshot.docs.map(doc => doc.data() as PlaylistInvite);
    callback(invites);
  });
};

/**
 * Listen to sent invitations by a user
 */
export const listenToSentInvites = (
  userId: string,
  callback: (invites: PlaylistInvite[]) => void
) => {
  const q = query(
    collection(db, 'playlistInvites'),
    where('fromUid', '==', userId),
    where('status', '==', 'pending')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const invites = querySnapshot.docs.map(doc => doc.data() as PlaylistInvite);
    callback(invites);
  });
};
