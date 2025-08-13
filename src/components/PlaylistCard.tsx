import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Users, ExternalLink } from "lucide-react";

interface PlaylistCardProps {
  id: string;
  name: string;
  songCount: number;
  collaborators: Array<{ name: string; platform: string }>;
  lastUpdated: string;
  onClick: () => void;
}

export const PlaylistCard = ({ 
  name, 
  songCount, 
  collaborators, 
  lastUpdated, 
  onClick 
}: PlaylistCardProps) => {
  return (
    <Card className="bg-gradient-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-card cursor-pointer group" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Music className="w-3 h-3" />
              <span>{songCount} songs</span>
              <span>•</span>
              <span>Updated {lastUpdated}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((collaborator, index) => (
                <Avatar key={index} className="w-6 h-6 border-2 border-card">
                  <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                    {collaborator.name.charAt(0)}
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
            {Array.from(new Set(collaborators.map(c => c.platform))).map((platform) => (
              <div
                key={platform}
                className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded-md"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};