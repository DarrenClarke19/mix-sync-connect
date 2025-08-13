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
import { Card } from "@/components/ui/card";
import { Plus, Search, Music, Sparkles } from "lucide-react";

interface AddSongModalProps {
  onAddSong: (song: { title: string; artist: string; platform: string }) => void;
}

const mockSearchResults = [
  { title: "Blinding Lights", artist: "The Weeknd", platform: "Spotify" },
  { title: "As It Was", artist: "Harry Styles", platform: "Apple Music" },
  { title: "Heat Waves", artist: "Glass Animals", platform: "Spotify" },
  { title: "Good 4 U", artist: "Olivia Rodrigo", platform: "Apple Music" },
];

export const AddSongModal = ({ onAddSong }: AddSongModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults] = useState(mockSearchResults);

  const handleAddSong = (song: { title: string; artist: string; platform: string }) => {
    onAddSong(song);
    setIsOpen(false);
    setSearchQuery("");
  };

  const filteredResults = searchResults.filter(
    song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <Plus className="w-4 h-4" />
          Add Song
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-card border border-border/50 backdrop-blur-sm max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Music className="w-4 h-4 text-primary-foreground" />
            </div>
            Add Song to Playlist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="search-song">Search for a song</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-song"
                placeholder="Song title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchQuery && filteredResults.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-matched across platforms</span>
                </div>
                {filteredResults.map((song, index) => (
                  <Card 
                    key={index}
                    className="bg-card/50 border border-border/30 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-card"
                    onClick={() => handleAddSong(song)}
                  >
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{song.title}</h4>
                        <p className="text-muted-foreground text-sm truncate">{song.artist}</p>
                      </div>
                      <div className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded-md">
                        {song.platform}
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            ) : searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No songs found</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search for songs</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};