import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Music, Plus, X } from "lucide-react";

interface ManualSongInputProps {
  onAddSong: (song: { title: string; artist: string; platform: string; platform_id?: string }) => void;
}

export const ManualSongInput = ({ onAddSong }: ManualSongInputProps) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !artist.trim()) {
      toast.error("Please enter both song title and artist");
      return;
    }

    onAddSong({
      title: title.trim(),
      artist: artist.trim(),
      platform: "manual",
      platform_id: undefined,
    });

    // Reset form
    setTitle("");
    setArtist("");
    setAlbum("");
    
    toast.success(`Added "${title.trim()}" to playlist`);
  };

  const handleClear = () => {
    setTitle("");
    setArtist("");
    setAlbum("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Add Song Manually
        </CardTitle>
        <CardDescription>
          Add songs to your playlist by entering the details manually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Song Title *
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter song title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-background text-foreground border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="artist" className="text-sm font-medium text-foreground">
                Artist *
              </label>
              <Input
                id="artist"
                type="text"
                placeholder="Enter artist name"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
                className="bg-background text-foreground border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="album" className="text-sm font-medium text-foreground">
              Album (Optional)
            </label>
            <Input
              id="album"
              type="text"
              placeholder="Enter album name"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="bg-background text-foreground border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Song
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
