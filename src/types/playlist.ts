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
