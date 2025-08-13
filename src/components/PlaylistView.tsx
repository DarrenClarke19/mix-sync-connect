import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SongItem } from "./SongItem";
import { AddSongModal } from "./AddSongModal";
import { ArrowLeft, Users, Download, Share2, Music } from "lucide-react";

interface PlaylistViewProps {
  playlist: {
    id: string;
    name: string;
    songs: Array<{
      id: string;
      title: string;
      artist: string;
      album?: string;
      addedBy: string;
      platform: string;
      likes: number;
      isLiked: boolean;
    }>;
    collaborators: Array<{ name: string; platform: string }>;
  };
  onBack: () => void;
  onAddSong: (song: { title: string; artist: string; platform: string }) => void;
  onLikeSong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
}

export const PlaylistView = ({ 
  playlist, 
  onBack, 
  onAddSong, 
  onLikeSong, 
  onRemoveSong 
}: PlaylistViewProps) => {
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = (platform: string) => {
    setExportStatus(`Exporting to ${platform}...`);
    setTimeout(() => {
      setExportStatus(`Exported to ${platform} successfully!`);
      setTimeout(() => setExportStatus(null), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{playlist.name}</h2>
          <p className="text-muted-foreground">{playlist.songs.length} songs</p>
        </div>
      </div>

      <Card className="bg-gradient-card border border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Collaborators</span>
              <div className="flex -space-x-2">
                {playlist.collaborators.map((collaborator, index) => (
                  <Avatar key={index} className="w-8 h-8 border-2 border-card">
                    <AvatarFallback className="text-sm bg-gradient-primary text-primary-foreground">
                      {collaborator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
            <AddSongModal onAddSong={onAddSong} />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport("Spotify")}
              disabled={!!exportStatus}
            >
              <Download className="w-4 h-4" />
              Export to Spotify
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport("Apple Music")}
              disabled={!!exportStatus}
            >
              <Download className="w-4 h-4" />
              Export to Apple Music
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
              Share Playlist
            </Button>
          </div>

          {exportStatus && (
            <div className="mt-3 p-3 bg-accent/20 text-accent-foreground rounded-lg text-sm">
              {exportStatus}
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {playlist.songs.length > 0 ? (
          playlist.songs.map((song) => (
            <SongItem
              key={song.id}
              title={song.title}
              artist={song.artist}
              album={song.album}
              addedBy={song.addedBy}
              platform={song.platform}
              likes={song.likes}
              isLiked={song.isLiked}
              onLike={() => onLikeSong(song.id)}
              onRemove={() => onRemoveSong(song.id)}
            />
          ))
        ) : (
          <Card className="bg-gradient-card border border-border/50">
            <div className="p-8 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No songs yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your collaborative playlist by adding the first song!
              </p>
              <AddSongModal onAddSong={onAddSong} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};