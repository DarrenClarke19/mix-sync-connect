import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface FirestoreUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  createdAt: Date;
  lastSeen: Date;
  isPublic: boolean; // Whether this user can be found in searches
}

export interface SearchUserResult {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isPublic: boolean;
}

/**
 * Search for users by email (partial match)
 */
export const searchUsersByEmail = async (
  searchQuery: string, 
  currentUserId: string,
  limitCount: number = 20
): Promise<SearchUserResult[]> => {
  try {
    console.log('📧 Searching users by email:', searchQuery);
    
    if (!searchQuery.trim()) return [];

    // Create a query to search for users with emails that contain the search query
    // Note: Firestore doesn't support full-text search, so we'll use a prefix search
    const usersRef = collection(db, 'users');
    
    // Simplified query that only filters by isPublic to avoid index issues
    const q = query(
      usersRef,
      where('isPublic', '==', true),
      limit(100) // Get more results for client-side filtering
    );

    console.log('🔍 Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('📊 Total documents found:', querySnapshot.size);

    const results: SearchUserResult[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as FirestoreUser;
      console.log('👤 Found user:', { uid: userData.uid, email: userData.email, isPublic: userData.isPublic });
      
      // Skip current user
      if (userData.uid === currentUserId) {
        console.log('⏭️ Skipping current user');
        return;
      }
      
      // Client-side filtering for email
      if (userData.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        console.log('✅ User matches email search');
        results.push({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          isPublic: userData.isPublic
        });
      } else {
        console.log('❌ User does not match email search');
      }
    });

    console.log('📧 Email search results before sorting:', results.length);

    // Sort and limit results
    const sortedResults = results
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.email.toLowerCase() === searchQuery.toLowerCase();
        const bExact = b.email.toLowerCase() === searchQuery.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      })
      .slice(0, limitCount);

    console.log('✅ Final email search results:', sortedResults.length);
    return sortedResults;
  } catch (error) {
    console.error('❌ Error searching users by email:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Search for users by display name (partial match)
 */
export const searchUsersByDisplayName = async (
  searchQuery: string,
  currentUserId: string,
  limitCount: number = 20
): Promise<SearchUserResult[]> => {
  try {
    if (!searchQuery.trim()) return [];

    const usersRef = collection(db, 'users');
    
    // Simplified query that only filters by isPublic to avoid index issues
    const q = query(
      usersRef,
      where('isPublic', '==', true),
      limit(100) // Get more results for client-side filtering
    );

    const querySnapshot = await getDocs(q);
    const results: SearchUserResult[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as FirestoreUser;
      
      // Skip current user
      if (userData.uid === currentUserId) return;
      
      // Client-side filtering for display name
      if (userData.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          isPublic: userData.isPublic
        });
      }
    });

    // Sort and limit results
    return results
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.displayName?.toLowerCase() === searchQuery.toLowerCase();
        const bExact = b.displayName?.toLowerCase() === searchQuery.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error searching users by display name:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Combined search that searches both email and display name
 */
export const searchUsers = async (
  searchQuery: string,
  currentUserId: string,
  limitCount: number = 20
): Promise<SearchUserResult[]> => {
  try {
    console.log('🔍 Starting user search for:', searchQuery);
    console.log('👤 Current user ID:', currentUserId);
    
    if (!searchQuery.trim()) return [];

    // Search by both email and display name
    const [emailResults, nameResults] = await Promise.all([
      searchUsersByEmail(searchQuery, currentUserId, limitCount / 2),
      searchUsersByDisplayName(searchQuery, currentUserId, limitCount / 2)
    ]);

    console.log('📧 Email search results:', emailResults.length);
    console.log('📝 Display name search results:', nameResults.length);

    // Combine and deduplicate results
    const combined = [...emailResults, ...nameResults];
    const uniqueResults = combined.filter((user, index, self) => 
      index === self.findIndex(u => u.uid === user.uid)
    );

    console.log('🔄 Combined unique results:', uniqueResults.length);

    // Sort by relevance (exact matches first, then partial matches)
    const sortedResults = uniqueResults.sort((a, b) => {
      const aEmailExact = a.email.toLowerCase() === searchQuery.toLowerCase();
      const bEmailExact = b.email.toLowerCase() === searchQuery.toLowerCase();
      const aNameExact = a.displayName?.toLowerCase() === searchQuery.toLowerCase();
      const bNameExact = b.displayName?.toLowerCase() === searchQuery.toLowerCase();

      if (aEmailExact && !bEmailExact) return -1;
      if (!aEmailExact && bEmailExact) return 1;
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;

      return 0;
    }).slice(0, limitCount);

    console.log('✅ Final search results:', sortedResults.length);
    return sortedResults;
  } catch (error) {
    console.error('❌ Error in combined user search:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid: string): Promise<FirestoreUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as FirestoreUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
}

/**
 * Create or update user profile
 */
export const upsertUserProfile = async (userData: Partial<FirestoreUser>): Promise<void> => {
  try {
    if (!userData.uid) throw new Error('User ID is required');
    
    console.log('🔍 Attempting to upsert user profile:', { uid: userData.uid, email: userData.email });
    
    // Filter out undefined values - Firestore doesn't allow them
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    
    const userRef = doc(db, 'users', userData.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('📝 Updating existing user profile');
      // Update existing user
      await updateDoc(userRef, {
        ...cleanUserData,
        lastSeen: new Date()
      });
      console.log('✅ User profile updated successfully');
    } else {
      console.log('🆕 Creating new user profile');
      // Create new user
      await setDoc(userRef, {
        ...cleanUserData,
        createdAt: new Date(),
        lastSeen: new Date(),
        isPublic: true // Default to public
      });
      console.log('✅ User profile created successfully');
    }
  } catch (error) {
    console.error('❌ Error upserting user profile:', error);
    throw new Error('Failed to save user profile');
  }
}

/**
 * Update user's last seen timestamp
 */
export const updateUserLastSeen = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Error updating user last seen:', error);
    // Don't throw error for this non-critical operation
  }
}
