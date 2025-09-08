import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Heart, MoreVertical, ExternalLink, Trash2 } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { Song } from "@/types/playlist";

interface SongItemProps {
  song: Song;
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
  console.log('🎵 SongItem received song:', song);
  
  const { title, artist, album, platform, likes } = song;
  // Handle both possible field names for addedBy
  const addedBy = (song as any).addedBy || (song as any).added_by || 'unknown';
  const { friends } = useUserStore();
  
  console.log('🎵 SongItem friends:', friends);
  console.log('🎵 SongItem addedBy:', addedBy);
  
  // Find the user profile for the person who added the song
  const addedByProfile = friends?.find(f => f.uid === addedBy);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'spotify':
        return <div className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'youtube':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      case 'apple':
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
      default:
        return <Music className="w-4 h-4" />;
    }
  };

  const getPlatformUrl = (platform: string, platformId?: string) => {
    if (!platformId) return null;
    
    switch (platform.toLowerCase()) {
      case 'spotify':
        return `https://open.spotify.com/track/${platformId}`;
      case 'youtube':
        return `https://youtube.com/watch?v=${platformId}`;
      case 'apple':
        return `https://music.apple.com/track/${platformId}`;
      default:
        return null;
    }
  };

  // Handle both possible field names for platform_id
  const platformId = (song as any).platform_id || (song as any).platformId;
  const platformUrl = getPlatformUrl(platform, platformId);

  return (
    <Card className="bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Platform Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-button">
              {getPlatformIcon(platform)}
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-sm text-muted-foreground truncate">{artist}</p>
            {album && (
              <p className="text-xs text-muted-foreground truncate">{album}</p>
            )}
          </div>

          {/* Added By */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                {addedByProfile?.displayName?.charAt(0) || addedBy.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">
              {addedByProfile?.displayName || addedBy}
            </span>
          </div>

          {/* Likes */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className="flex items-center gap-1 text-muted-foreground hover:text-red-500"
            >
              <Heart className="w-4 h-4" />
              <span className="text-sm">{likes}</span>
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {platformUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(platformUrl, '_blank')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            
            {canRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
