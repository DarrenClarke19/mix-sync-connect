import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Heart, MoreVertical, ExternalLink, Trash2 } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";

interface SongItemProps {
  song: {
    id?: string;
    title: string;
    artist: string;
    album?: string;
    platform: string;
    platformId?: string;
    addedBy: string;
    addedAt: Date;
    likes: number;
  };
  onLike: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const SongItem = ({
  song,
  onLike,
  onRemove,
  canRemove,
}: SongItemProps) => {
  const { title, artist, album, addedBy, platform, likes } = song;
  const { profile } = useUserStore();
  
  // Get the display name for the user who added the song
  const getAddedByDisplay = () => {
    // Check if the current user added this song
    if (addedBy === profile?.uid || addedBy === 'unknown') {
      return profile?.displayName || profile?.email?.split('@')[0] || 'You';
    }
    
    // For other users, try to show a meaningful name
    if (addedBy.includes('@')) {
      return addedBy.split('@')[0]; // Show username part of email
    }
    
    // If it's a UID, show first few characters
    if (addedBy.length > 20) {
      return addedBy.substring(0, 8) + '...';
    }
    
    return addedBy;
  };

  return (
    <Card className="bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-button">
            <Music className="w-6 h-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{title}</h4>
            <p className="text-muted-foreground text-sm truncate">{artist}</p>
            {album && (
              <p className="text-muted-foreground text-xs truncate">{album}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="w-4 h-4">
                <AvatarFallback className="text-xs bg-secondary">
                  {getAddedByDisplay().charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">Added by {getAddedByDisplay()}</span>
              <span className="text-xs text-accent">• {platform}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Heart className="w-4 h-4" />
              <span className="text-xs ml-1">{likes}</span>
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
            {canRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 text-red-500 hover:text-red-600"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};