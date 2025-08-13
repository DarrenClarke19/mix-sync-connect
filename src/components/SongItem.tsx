import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Heart, MoreVertical, ExternalLink } from "lucide-react";

interface SongItemProps {
  title: string;
  artist: string;
  album?: string;
  addedBy: string;
  platform: string;
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  onRemove: () => void;
}

export const SongItem = ({
  title,
  artist,
  album,
  addedBy,
  platform,
  likes,
  isLiked,
  onLike,
}: SongItemProps) => {
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
                  {addedBy.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">Added by {addedBy}</span>
              <span className="text-xs text-accent">• {platform}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={`p-2 ${isLiked ? 'text-red-400 hover:text-red-300' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs ml-1">{likes}</span>
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};