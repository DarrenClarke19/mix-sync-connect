import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Search, Music, Plus, ExternalLink, Play, Youtube } from "lucide-react";

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    publishedAt: string;
  };
}

interface YouTubeMusicSearchProps {
  onAddSong: (song: { title: string; artist: string; platform: string; platform_id?: string }) => void;
}

export const YouTubeMusicSearch = ({ onAddSong }: YouTubeMusicSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchYouTubeMusic = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setResults([]);

    try {
      // YouTube Data API endpoint
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        toast.error("YouTube API key not configured");
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " music")}&type=video&videoCategoryId=10&maxResults=20&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to search YouTube');
      }

      const data = await response.json();
      if (data.items) {
        setResults(data.items);
      }
    } catch (error) {
      console.error("YouTube search error:", error);
      toast.error("Failed to search YouTube Music");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = (video: YouTubeVideo) => {
    // Extract song title and artist from YouTube title
    const title = video.snippet.title
      .replace(/\(Official Music Video\)/gi, '')
      .replace(/\(Official Video\)/gi, '')
      .replace(/\(Audio\)/gi, '')
      .replace(/\(Lyrics\)/gi, '')
      .replace(/\[Official Music Video\]/gi, '')
      .replace(/\[Official Video\]/gi, '')
      .replace(/\[Audio\]/gi, '')
      .replace(/\[Lyrics\]/gi, '')
      .trim();

    onAddSong({
      title: title,
      artist: video.snippet.channelTitle,
      platform: "youtube_music",
      platform_id: video.id.videoId,
    });

    setQuery("");
    setResults([]);
    toast.success(`Added "${title}" to playlist`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchYouTubeMusic();
    }
  };

  const openYouTubeVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          Search YouTube Music
        </CardTitle>
        <CardDescription>
          Search for songs on YouTube Music and add them to your playlist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search YouTube Music for songs, artists, or albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={searchYouTubeMusic}
            disabled={!query.trim() || isSearching}
            size="sm"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((video) => (
              <div
                key={video.id.videoId}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {video.snippet.title
                      .replace(/\(Official Music Video\)/gi, '')
                      .replace(/\(Official Video\)/gi, '')
                      .replace(/\(Audio\)/gi, '')
                      .replace(/\(Lyrics\)/gi, '')
                      .replace(/\[Official Music Video\]/gi, '')
                      .replace(/\[Official Video\]/gi, '')
                      .replace(/\[Audio\]/gi, '')
                      .replace(/\[Lyrics\]/gi, '')
                      .trim()}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {video.snippet.channelTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPublishedDate(video.snippet.publishedAt)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openYouTubeVideo(video.id.videoId)}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddSong(video)}
                    className="h-8 px-3"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {query && !isSearching && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No songs found for "{query}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>Powered by YouTube Data API</p>
          <p>Results include official music videos, audio tracks, and covers</p>
        </div>
      </CardContent>
    </Card>
  );
};
