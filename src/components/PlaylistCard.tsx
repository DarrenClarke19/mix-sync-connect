import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Users, ExternalLink, Trash2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { deletePlaylist } from "@/lib/playlistService";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { toast } from "sonner";

interface PlaylistCardProps {
  id?: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: string[];
  songs: Array<{
    id?: string;
    title: string;
    artist: string;
    album?: string;
    platform: string;
    platformId?: string;
    addedBy: string;
    addedAt: Date;
    likes: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  onClick: () => void;
}

export const PlaylistCard = ({ 
  id,
  name, 
  description,
  ownerId,
  collaborators, 
  songs,
  updatedAt,
  onClick 
}: PlaylistCardProps) => {
  const { user } = useFirebaseAuth();
  const { removePlaylist } = usePlaylistStore();
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    if (!id || !user?.uid) {
      toast.error("Cannot delete playlist");
      return;
    }

    if (user.uid !== ownerId) {
      toast.error("Only the playlist owner can delete it");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePlaylist(id);
      removePlaylist(id);
      toast.success("Playlist deleted successfully");
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    }
  };

  return (
    <Card className="bg-gradient-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-card cursor-pointer group" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="text-muted-foreground text-sm mt-1">{description}</p>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Music className="w-3 h-3" />
              <span>{songs.length} song{songs.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Updated {formatTimeAgo(updatedAt)}</span>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon">
              <ExternalLink className="w-4 h-4" />
            </Button>
            {user?.uid === ownerId && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((collaborator, index) => (
                <Avatar key={index} className="w-6 h-6 border-2 border-card">
                  <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                    {collaborator.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{collaborators.length - 3}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-1">
            {songs.length > 0 && (
              <div className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded-md">
                {songs[0]?.platform || 'Manual'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};