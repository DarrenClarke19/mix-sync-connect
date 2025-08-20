import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/userService';
import { useUserStore } from '@/stores/useUserStore';
import { usePlaylistStore } from '@/stores/usePlaylistStore';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const clearUserStore = useUserStore(state => state.clearUserData);
  const clearPlaylistStore = usePlaylistStore(state => state.clearPlaylistData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Create/update user profile in Firestore when auth state changes
      if (user) {
        try {
          await upsertUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
            isPublic: true
          });
        } catch (error) {
          console.error('Error creating/updating user profile:', error);
          // Don't show error to user as this is background operation
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      try {
        await upsertUserProfile({
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || undefined,
          photoURL: result.user.photoURL || undefined,
          isPublic: true
        });
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't fail signup if profile creation fails
      }
      
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: { message: error.message } };
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // Clear stores on logout
      clearUserStore();
      clearPlaylistStore();
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut: signOutUser,
  };
}
