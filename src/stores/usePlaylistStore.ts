import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Song {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  platform: string;
  platform_id?: string;
  addedBy: string;
  addedAt: Date;
  likes: number;
}

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

interface PlaylistState {
  // Playlists
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  
  // Invites
  playlistInvites: PlaylistInvite[];
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  
  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  syncPlaylist: (playlist: Playlist) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  setPlaylistInvites: (invites: PlaylistInvite[]) => void;
  
  // Playlist Management
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  removePlaylist: (playlistId: string) => void;
  
  // Song Management
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  updateSongInPlaylist: (playlistId: string, songId: string, updates: Partial<Song>) => void;
  likeSongInPlaylist: (playlistId: string, songId: string) => void;
  
  // Collaboration
  addCollaborator: (playlistId: string, collaboratorUid: string) => void;
  removeCollaborator: (playlistId: string, collaboratorUid: string) => void;
  
  // Invites
  addPlaylistInvite: (invite: PlaylistInvite) => void;
  removePlaylistInvite: (inviteId: string) => void;
  updatePlaylistInvite: (inviteId: string, updates: Partial<PlaylistInvite>) => void;
  
  // Loading States
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  
  // Utility Actions
  clearPlaylistData: () => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  getUserPlaylists: (userId: string) => Playlist[];
  getCollaborativePlaylists: (userId: string) => Playlist[];
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // Initial State
      playlists: [],
      currentPlaylist: null,
      playlistInvites: [],
      isLoading: false,
      isCreating: false,

      // Actions
      setPlaylists: (playlists) => set({ playlists }),
      
      syncPlaylist: (playlist) => set((state) => {
        // Only add if not already in store (prevents duplicates)
        const exists = state.playlists.some(p => p.id === playlist.id);
        if (exists) {
          // Update existing playlist
          return {
            playlists: state.playlists.map(p => 
              p.id === playlist.id ? { ...playlist, updatedAt: new Date() } : p
            )
          };
        } else {
          // Add new playlist
          return {
            playlists: [...state.playlists, playlist]
          };
        }
      }),
      
      setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
      
      setPlaylistInvites: (invites) => set({ playlistInvites: invites }),
      
      // Playlist Management
      addPlaylist: (playlist) => set((state) => ({
        playlists: [...state.playlists, playlist]
      })),
      
      updatePlaylist: (playlistId, updates) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId ? { ...p, ...updates, updatedAt: new Date() } : p
        )
      })),
      
      removePlaylist: (playlistId) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== playlistId),
        currentPlaylist: state.currentPlaylist?.id === playlistId ? null : state.currentPlaylist
      })),
      
      // Song Management
      addSongToPlaylist: (playlistId, song) => set((state) => {
        console.log('addSongToPlaylist called with:', { playlistId, song });
        
        // Only update the playlists array - the currentPlaylist will be updated
        // when the component re-renders and picks up the new data
        return {
          playlists: state.playlists.map(p => 
            p.id === playlistId 
              ? { 
                  ...p, 
                  songs: [...p.songs, song], 
                  updatedAt: new Date() 
                }
              : p
          )
        };
      }),
      
      removeSongFromPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { 
                ...p, 
                songs: p.songs.filter(s => s.id !== songId), 
                updatedAt: new Date() 
              }
            : p
        )
      })),
      
      updateSongInPlaylist: (playlistId, songId, updates) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { 
                ...p, 
                songs: p.songs.map(s => 
                  s.id === songId ? { ...s, ...updates } : s
                ), 
                updatedAt: new Date() 
              }
            : p
        )
      })),
      
      likeSongInPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { 
                ...p, 
                songs: p.songs.map(s => 
                  s.id === songId ? { ...s, likes: s.likes + 1 } : s
                ), 
                updatedAt: new Date() 
              }
            : p
        )
      })),
      
      // Collaboration
      addCollaborator: (playlistId, collaboratorUid) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { 
                ...p, 
                collaborators: [...p.collaborators, collaboratorUid], 
                updatedAt: new Date() 
              }
            : p
        )
      })),
      
      removeCollaborator: (playlistId, collaboratorUid) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { 
                ...p, 
                collaborators: p.collaborators.filter(c => c !== collaboratorUid), 
                updatedAt: new Date() 
            }
          : p
        )
      })),
      
      // Invites
      addPlaylistInvite: (invite) => set((state) => ({
        playlistInvites: [...state.playlistInvites, invite]
      })),
      
      removePlaylistInvite: (inviteId) => set((state) => ({
        playlistInvites: state.playlistInvites.filter(i => i.id !== inviteId)
      })),
      
      updatePlaylistInvite: (inviteId, updates) => set((state) => ({
        playlistInvites: state.playlistInvites.map(i => 
          i.id === inviteId ? { ...i, ...updates } : i
        )
      })),
      
      // Loading States
      setLoading: (loading) => set({ isLoading: loading }),
      
      setCreating: (creating) => set({ isCreating: creating }),
      
      // Utility Actions
      clearPlaylistData: () => set({
        playlists: [],
        currentPlaylist: null,
        playlistInvites: [],
        isLoading: false,
        isCreating: false
      }),
      
      getPlaylistById: (playlistId) => {
        const state = get();
        return state.playlists.find(p => p.id === playlistId);
      },
      
      getUserPlaylists: (userId) => {
        const state = get();
        return state.playlists.filter(p => p.ownerId === userId);
      },
      
      getCollaborativePlaylists: (userId) => {
        const state = get();
        return state.playlists.filter(p => 
          p.ownerId === userId || p.collaborators.includes(userId)
        );
      }
    }),
    {
      name: 'mixmate-playlist-store',
      partialize: (state) => ({
        // Only persist playlists and invites, not current state
        playlists: state.playlists,
        playlistInvites: state.playlistInvites
      })
    }
  )
);
