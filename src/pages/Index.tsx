import { useState } from "react";
import { MixMateHeader } from "@/components/MixMateHeader";
import { PlaylistCard } from "@/components/PlaylistCard";
import { CreatePlaylistModal } from "@/components/CreatePlaylistModal";
import { PlaylistView } from "@/components/PlaylistView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-music.jpg";
import { Music, Users, Zap, ArrowRight } from "lucide-react";

// Mock data
const mockPlaylists = [
  {
    id: "1",
    name: "Summer Vibes 🌞",
    songCount: 24,
    collaborators: [
      { name: "Alex", platform: "Spotify" },
      { name: "Maya", platform: "Apple Music" },
      { name: "Jordan", platform: "Spotify" }
    ],
    lastUpdated: "2 hours ago",
    songs: [
      {
        id: "1",
        title: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        addedBy: "Alex",
        platform: "Spotify",
        likes: 5,
        isLiked: true
      },
      {
        id: "2", 
        title: "As It Was",
        artist: "Harry Styles",
        album: "Harry's House",
        addedBy: "Maya",
        platform: "Apple Music",
        likes: 3,
        isLiked: false
      }
    ]
  },
  {
    id: "2",
    name: "Study Session 📚",
    songCount: 18,
    collaborators: [
      { name: "Sam", platform: "Apple Music" },
      { name: "Riley", platform: "Spotify" }
    ],
    lastUpdated: "1 day ago",
    songs: []
  },
  {
    id: "3",
    name: "Workout Mix 💪",
    songCount: 32,
    collaborators: [
      { name: "Chris", platform: "Spotify" },
      { name: "Dana", platform: "Apple Music" },
      { name: "Taylor", platform: "Spotify" },
      { name: "Morgan", platform: "Apple Music" }
    ],
    lastUpdated: "3 days ago",
    songs: []
  }
];

const Index = () => {
  const [currentView, setCurrentView] = useState("home");
  const [playlists, setPlaylists] = useState(mockPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleCreatePlaylist = (name: string) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songCount: 0,
      collaborators: [{ name: "You", platform: "Spotify" }],
      lastUpdated: "just now",
      songs: []
    };
    setPlaylists([newPlaylist, ...playlists]);
  };

  const handleAddSong = (song: { title: string; artist: string; platform: string }) => {
    if (selectedPlaylist) {
      const newSong = {
        id: Date.now().toString(),
        ...song,
        album: "Unknown Album",
        addedBy: "You",
        likes: 0,
        isLiked: false
      };
      
      const updatedPlaylist = {
        ...selectedPlaylist,
        songs: [...selectedPlaylist.songs, newSong],
        songCount: selectedPlaylist.songs.length + 1
      };
      
      setSelectedPlaylist(updatedPlaylist);
      setPlaylists(playlists.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    }
  };

  const handleLikeSong = (songId: string) => {
    if (selectedPlaylist) {
      const updatedSongs = selectedPlaylist.songs.map((song: any) =>
        song.id === songId 
          ? { 
              ...song, 
              isLiked: !song.isLiked,
              likes: song.isLiked ? song.likes - 1 : song.likes + 1
            }
          : song
      );
      setSelectedPlaylist({ ...selectedPlaylist, songs: updatedSongs });
    }
  };

  const handleRemoveSong = (songId: string) => {
    if (selectedPlaylist) {
      const updatedSongs = selectedPlaylist.songs.filter((song: any) => song.id !== songId);
      setSelectedPlaylist({ ...selectedPlaylist, songs: updatedSongs });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 p-4 bg-gradient-primary rounded-2xl shadow-glow mb-6">
                  <Music className="w-8 h-8 text-primary-foreground" />
                  <h1 className="text-3xl font-bold text-primary-foreground">MixMate</h1>
                </div>
                <p className="text-xl text-muted-foreground mb-2">Collaborative Playlists</p>
                <p className="text-lg text-muted-foreground">Share music with friends across all platforms</p>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden mb-8 shadow-card">
                <img 
                  src={heroImage} 
                  alt="MixMate collaborative music experience"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-gradient-card border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-primary rounded-lg shadow-button">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">Cross-Platform</h3>
                </div>
                <p className="text-muted-foreground">
                  Connect Spotify, Apple Music, and more. Friends can add songs from their platform.
                </p>
              </Card>

              <Card className="bg-gradient-card border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-primary rounded-lg shadow-button">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">AI-Powered</h3>
                </div>
                <p className="text-muted-foreground">
                  Smart song matching across platforms. AI finds the same track everywhere.
                </p>
              </Card>

              <Card className="bg-gradient-card border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-primary rounded-lg shadow-button">
                    <Music className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">Real-Time Sync</h3>
                </div>
                <p className="text-muted-foreground">
                  Changes appear instantly. Export to your platform with one tap.
                </p>
              </Card>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => setIsLoggedIn(true)}
                className="text-lg px-8 py-6"
              >
                Get Started with MixMate
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-muted-foreground text-sm mt-4">
                Connect your music platform and start collaborating
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-background">
        <MixMateHeader currentView={currentView} onViewChange={setCurrentView} />
        <div className="container mx-auto px-4 py-6">
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={() => setSelectedPlaylist(null)}
            onAddSong={handleAddSong}
            onLikeSong={handleLikeSong}
            onRemoveSong={handleRemoveSong}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MixMateHeader currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your Playlists</h2>
              <p className="text-muted-foreground">Collaborate on music with friends</p>
            </div>
          </div>

          <div className="grid gap-4 mb-6">
            <CreatePlaylistModal onCreatePlaylist={handleCreatePlaylist} />
          </div>

          <div className="space-y-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                {...playlist}
                onClick={() => setSelectedPlaylist(playlist)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
