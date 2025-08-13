import { Button } from "@/components/ui/button";
import { Music, Users, Settings } from "lucide-react";

interface MixMateHeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const MixMateHeader = ({ currentView, onViewChange }: MixMateHeaderProps) => {
  return (
    <header className="bg-gradient-card border-b border-border/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
              <Music className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                MixMate
              </h1>
              <p className="text-muted-foreground text-sm">Collaborative Playlists</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === "playlists" ? "gradient" : "ghost"}
              size="sm"
              onClick={() => onViewChange("playlists")}
            >
              <Music className="w-4 h-4" />
              Playlists
            </Button>
            <Button
              variant={currentView === "friends" ? "gradient" : "ghost"}
              size="sm"
              onClick={() => onViewChange("friends")}
            >
              <Users className="w-4 h-4" />
              Friends
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};