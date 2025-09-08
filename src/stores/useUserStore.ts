import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';

export interface Friend {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  status: 'pending' | 'accepted' | 'sent';
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromEmail: string;
  fromDisplayName?: string;
  fromPhotoURL?: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  createdAt: Date;
  lastSeen: Date;
}

interface UserState {
  // Firebase Auth User
  currentUser: User | null;
  
  // User Profile
  profile: UserProfile | null;
  
  // Friends System
  friends: Friend[];
  friendRequests: FriendRequest[];
  pendingSentRequests: FriendRequest[];
  
  // UI State
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setFriends: (friends: Friend[]) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  setPendingSentRequests: (requests: FriendRequest[]) => void;
  
  // Friend Management
  addFriend: (friend: Friend) => void;
  removeFriend: (friendUid: string) => void;
  updateFriend: (friendUid: string, updates: Partial<Friend>) => void;
  
  // Friend Requests
  addFriendRequest: (request: FriendRequest) => void;
  removeFriendRequest: (requestId: string) => void;
  updateFriendRequest: (requestId: string, updates: Partial<FriendRequest>) => void;
  
  // Pending Sent Requests
  addPendingSentRequest: (request: FriendRequest) => void;
  removePendingSentRequest: (requestId: string) => void;
  updatePendingSentRequest: (requestId: string, updates: Partial<FriendRequest>) => void;
  
  // Loading States
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Utility Actions
  clearUserData: () => void;
  isFriend: (uid: string) => boolean;
  hasPendingRequest: (uid: string) => boolean;
  getFriendByUid: (uid: string) => Friend | undefined;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      profile: null,
      friends: [],
      friendRequests: [],
      pendingSentRequests: [],
      isLoading: false,
      isInitialized: false,

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      setProfile: (profile) => set({ profile }),
      
      setFriends: (friends) => set({ friends }),
      
      setFriendRequests: (requests) => set({ friendRequests: requests }),
      
      setPendingSentRequests: (requests) => set({ pendingSentRequests: requests }),
      
      addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend]
      })),
      
      removeFriend: (friendUid) => set((state) => ({
        friends: state.friends.filter(f => f.uid !== friendUid)
      })),
      
      updateFriend: (friendUid, updates) => set((state) => ({
        friends: state.friends.map(f => 
          f.uid === friendUid ? { ...f, ...updates } : f
        )
      })),
      
      addFriendRequest: (request) => set((state) => ({
        friendRequests: [...state.friendRequests, request]
      })),
      
      removeFriendRequest: (requestId) => set((state) => ({
        friendRequests: state.friendRequests.filter(r => r.id !== requestId)
      })),
      
      updateFriendRequest: (requestId, updates) => set((state) => ({
        friendRequests: state.friendRequests.map(r => 
          r.id === requestId ? { ...r, ...updates } : r
        )
      })),
      
      addPendingSentRequest: (request) => set((state) => ({
        pendingSentRequests: [...state.pendingSentRequests, request]
      })),
      
      removePendingSentRequest: (requestId) => set((state) => ({
        pendingSentRequests: state.pendingSentRequests.filter(r => r.id !== requestId)
      })),
      
      updatePendingSentRequest: (requestId, updates) => set((state) => ({
        pendingSentRequests: state.pendingSentRequests.map(r => 
          r.id === requestId ? { ...r, ...updates } : r
        )
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      
      clearUserData: () => set({
        currentUser: null,
        profile: null,
        friends: [],
        friendRequests: [],
        pendingSentRequests: [],
        isLoading: false,
        isInitialized: false
      }),
      
      // Utility Functions
      isFriend: (uid) => {
        const state = get();
        return state.friends.some(f => f.uid === uid && f.status === 'accepted');
      },
      
      hasPendingRequest: (uid) => {
        const state = get();
        return state.friendRequests.some(r => r.fromUid === uid && r.status === 'pending') ||
               state.pendingSentRequests.some(r => r.toUid === uid && r.status === 'pending');
      },
      
      getFriendByUid: (uid) => {
        const state = get();
        return state.friends.find(f => f.uid === uid);
      }
    }),
    {
      name: 'mixmate-user-store',
      partialize: (state) => ({
        // Only persist non-sensitive data
        profile: state.profile,
        friends: state.friends,
        friendRequests: state.friendRequests,
        pendingSentRequests: state.pendingSentRequests,
        isInitialized: state.isInitialized
      }),
      // Don't persist Firebase user object or loading states
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized(true);
        }
      }
    }
  )
);

