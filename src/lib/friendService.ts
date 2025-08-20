import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirestoreFriendRequest {
  id: string;
  fromUid: string;
  fromEmail: string;
  fromDisplayName?: string | null;
  fromPhotoURL?: string | null;
  toUid: string;
  toEmail: string;
  toDisplayName?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreFriend {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  status: 'pending' | 'accepted' | 'sent';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUid: string,
  fromEmail: string,
  fromDisplayName: string | undefined,
  fromPhotoURL: string | undefined,
  toUid: string,
  toEmail: string,
  toDisplayName: string | undefined
): Promise<void> => {
  try {
    const requestId = `${fromUid}_${toUid}`;
    const requestRef = doc(db, 'friendRequests', requestId);
    
    // Create the friend request object
    const friendRequest: FirestoreFriendRequest = {
      id: requestId,
      fromUid,
      fromEmail,
      fromDisplayName,
      fromPhotoURL,
      toUid,
      toEmail,
      toDisplayName,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Filter out undefined values to prevent Firestore errors
    const cleanFriendRequest = Object.fromEntries(
      Object.entries(friendRequest).filter(([_, value]) => value !== undefined)
    );
    
    await setDoc(requestRef, cleanFriendRequest);
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw new Error('Failed to send friend request');
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }
    
    const requestData = requestDoc.data() as FirestoreFriendRequest;
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      updatedAt: new Date()
    });
    
    // Create friend relationships for both users
    const friend1Id = `${requestData.fromUid}_${requestData.toUid}`;
    const friend2Id = `${requestData.toUid}_${requestData.fromUid}`;
    
    const friend1: FirestoreFriend = {
      uid: requestData.toUid,
      email: requestData.toEmail,
      displayName: requestData.toDisplayName,
      photoURL: null, // Use null instead of undefined for Firestore
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const friend2: FirestoreFriend = {
      uid: requestData.fromUid,
      email: requestData.fromEmail,
      displayName: requestData.fromDisplayName,
      photoURL: requestData.fromPhotoURL,
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Filter out undefined values to prevent Firestore errors
    const cleanFriend1 = Object.fromEntries(
      Object.entries(friend1).filter(([_, value]) => value !== undefined)
    );
    
    const cleanFriend2 = Object.fromEntries(
      Object.entries(friend2).filter(([_, value]) => value !== undefined)
    );
    
    // Add to friends collection for both users
    await Promise.all([
      setDoc(doc(db, 'users', requestData.fromUid, 'friends', friend1Id), cleanFriend1),
      setDoc(doc(db, 'users', requestData.toUid, 'friends', friend2Id), cleanFriend2)
    ]);
    
    // Delete the friend request document since it's no longer needed
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw new Error('Failed to accept friend request');
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (requestId: string, currentUserId: string): Promise<void> => {
  try {
    console.log('🔍 Attempting to reject friend request with ID:', requestId);
    console.log('🔍 Current user ID:', currentUserId);
    console.log('🔍 Request ID type:', typeof requestId);
    console.log('🔍 Request ID length:', requestId.length);
    
    const requestRef = doc(db, 'friendRequests', requestId);
    console.log('🔍 Document reference path:', requestRef.path);
    
    // Try to delete the document directly first
    try {
      console.log('🔍 Attempting direct delete...');
      await deleteDoc(requestRef);
      console.log('✅ Document deleted successfully');
      return;
    } catch (deleteError) {
      console.log('🔍 Direct delete failed, trying to read document first...');
      console.log('🔍 Delete error:', deleteError);
      
      // If direct delete fails, try to read the document to understand why
      try {
        const requestDoc = await getDoc(requestRef);
        
        if (!requestDoc.exists()) {
          console.log('❌ Document does not exist');
          throw new Error('Friend request not found');
        }
        
        const requestData = requestDoc.data() as FirestoreFriendRequest;
        console.log('🔍 Document data:', requestData);
        console.log('🔍 Document ID from data:', requestData.id);
        console.log('🔍 Request fromUid:', requestData.fromUid);
        console.log('🔍 Request toUid:', requestData.toUid);
        
        // Verify that the current user has permission to reject this request
        if (requestData.fromUid !== currentUserId && requestData.toUid !== currentUserId) {
          console.log('❌ Permission denied - user mismatch');
          throw new Error('You do not have permission to reject this friend request');
        }
        
        console.log('✅ Permission verified, but delete still failed');
        throw new Error('Permission verified but delete operation failed');
      } catch (readError) {
        console.log('🔍 Read operation also failed:', readError);
        throw deleteError; // Throw the original delete error
      }
    }
  } catch (error) {
    console.error('❌ Error rejecting friend request:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
    }
    throw new Error('Failed to reject friend request');
  }
};

/**
 * Get friend requests for a user
 */
export const getFriendRequests = async (userId: string): Promise<FirestoreFriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('toUid', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests: FirestoreFriendRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        ...doc.data(),
        id: doc.id
      } as FirestoreFriendRequest);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting friend requests:', error);
    throw new Error('Failed to get friend requests');
  }
};

/**
 * Get pending sent requests for a user
 */
export const getPendingSentRequests = async (userId: string): Promise<FirestoreFriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('fromUid', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests: FirestoreFriendRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        ...doc.data(),
        id: doc.id
      } as FirestoreFriendRequest);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting pending sent requests:', error);
    throw new Error('Failed to get pending sent requests');
  }
};

/**
 * Get friends for a user
 */
export const getFriends = async (userId: string): Promise<FirestoreFriend[]> => {
  try {
    const friendsRef = collection(db, 'users', userId, 'friends');
    const q = query(
      friendsRef,
      where('status', '==', 'accepted'),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const friends: FirestoreFriend[] = [];
    
    querySnapshot.forEach((doc) => {
      friends.push(doc.data() as FirestoreFriend);
    });
    
    return friends;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw new Error('Failed to get friends');
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (userId: string, friendUid: string): Promise<void> => {
  try {
    const friend1Id = `${userId}_${friendUid}`;
    const friend2Id = `${friendUid}_${userId}`;
    
    // Remove from both users' friend lists
    await Promise.all([
      deleteDoc(doc(db, 'users', userId, 'friends', friend1Id)),
      deleteDoc(doc(db, 'users', friendUid, 'friends', friend2Id))
    ]);
  } catch (error) {
    console.error('Error removing friend:', error);
    throw new Error('Failed to remove friend');
  }
};

/**
 * Listen to friend requests changes
 */
export const listenToFriendRequests = (
  userId: string,
  callback: (requests: FirestoreFriendRequest[]) => void
): Unsubscribe => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('toUid', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const requests: FirestoreFriendRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({
        ...doc.data(),
        id: doc.id
      } as FirestoreFriendRequest);
    });
    callback(requests);
  });
};

/**
 * Listen to friends changes
 */
export const listenToFriends = (
  userId: string,
  callback: (friends: FirestoreFriend[]) => void
): Unsubscribe => {
  const friendsRef = collection(db, 'users', userId, 'friends');
  const q = query(
    friendsRef,
    where('status', '==', 'accepted'),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const friends: FirestoreFriend[] = [];
    querySnapshot.forEach((doc) => {
      friends.push(doc.data() as FirestoreFriend);
    });
    callback(friends);
  });
};
