import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Music } from "lucide-react";

interface CreatePlaylistModalProps {
  onCreatePlaylist: (name: string) => void;
}

export const CreatePlaylistModal = ({ onCreatePlaylist }: CreatePlaylistModalProps) => {
  const [playlistName, setPlaylistName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = () => {
    if (playlistName.trim()) {
      onCreatePlaylist(playlistName.trim());
      setPlaylistName("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full">
          <Plus className="w-4 h-4" />
          Create New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-card border border-border/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Music className="w-4 h-4 text-primary-foreground" />
            </div>
            Create Collaborative Playlist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              placeholder="Enter playlist name..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreate} className="flex-1">
              Create Playlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};