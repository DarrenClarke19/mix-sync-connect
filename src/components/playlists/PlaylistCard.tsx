import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Users, ExternalLink, Trash2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { deletePlaylist } from "@/services/firebase/playlistService";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { toast } from "sonner";
import { Playlist } from "@/types/playlist";
import { useNavigate } from "react-router-dom";

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  const { user } = useFirebaseAuth();
  const { removePlaylist } = usePlaylistStore();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!playlist.id) return;
    
    if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      try {
        await deletePlaylist(playlist.id);
        removePlaylist(playlist.id);
        toast.success("Playlist deleted successfully");
      } catch (error) {
        console.error("Error deleting playlist:", error);
        toast.error("Failed to delete playlist");
      }
    }
  };

  const isOwner = user?.uid === playlist.ownerId;
  const isCollaborator = playlist.collaborators.includes(user?.uid || '');

  return (
    <Card className="bg-gradient-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-card cursor-pointer group" onClick={handleClick}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-button">
              <Music className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {playlist.name}
              </h3>
              {playlist.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {playlist.description}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              <span>{playlist.songs.length} songs</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{playlist.collaborators.length} collaborators</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Updated {new Date(playlist.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Collaborators */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Collaborators:</span>
          <div className="flex -space-x-2">
            {playlist.collaborators.slice(0, 3).map((collaboratorId, index) => (
              <Avatar key={collaboratorId} className="w-6 h-6 border-2 border-background">
                <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                  {collaboratorId.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {playlist.collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  +{playlist.collaborators.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Songs Preview */}
        {playlist.songs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Recent songs:</div>
            <div className="space-y-1">
              {playlist.songs.slice(0, 2).map((song, index) => (
                <div key={song.id || index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span className="truncate">{song.title}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground truncate">{song.artist}</span>
                </div>
              ))}
              {playlist.songs.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{playlist.songs.length - 2} more songs
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
