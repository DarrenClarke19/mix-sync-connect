import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  Loader2,
  Check,
  X,
  Plus
} from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface Friend {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  status: 'pending' | 'accepted' | 'sent';
  createdAt: Date;
}

interface PlaylistInviteModalProps {
  playlistId: string;
  playlistName: string;
  currentCollaborators: string[];
  onInviteSent: (friendUid: string) => void;
  trigger?: React.ReactNode;
}

export const PlaylistInviteModal = ({ 
  playlistId, 
  playlistName, 
  currentCollaborators,
  onInviteSent,
  trigger 
}: PlaylistInviteModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadFriends();
    }
  }, [isOpen, user]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      // This would be implemented in firebaseService
      // For now, using mock data
      const mockFriends: Friend[] = [
        {
          uid: 'friend1',
          email: 'friend1@example.com',
          displayName: 'John Doe',
          status: 'accepted',
          createdAt: new Date()
        },
        {
          uid: 'friend2',
          email: 'friend2@example.com',
          displayName: 'Jane Smith',
          status: 'accepted',
          createdAt: new Date()
        }
      ];
      setFriends(mockFriends);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load friends');
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // This would search Firebase Auth users or a users collection
      // For now, using mock data
      const mockResults = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          displayName: 'Alice Johnson'
        }
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const sendPlaylistInvite = async (friendUid: string, friendEmail: string) => {
    if (!user) return;
    
    try {
      // This would be implemented in firebaseService
      toast.success(`Invitation sent to ${friendEmail}!`);
      onInviteSent(friendUid);
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending playlist invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchUsers();
    }
  };

  const isAlreadyCollaborator = (friendUid: string) => {
    return currentCollaborators.includes(friendUid);
  };

  const filteredFriends = friends.filter(friend => !isAlreadyCollaborator(friend.uid));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Friends
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Friends to "{playlistName}"</DialogTitle>
          <DialogDescription>
            Invite your friends to collaborate on this playlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Collaborators */}
          <div>
            <h3 className="font-medium mb-3">Current Collaborators</h3>
            <div className="space-y-2">
              {currentCollaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collaborators yet</p>
              ) : (
                currentCollaborators.map((collabUid) => {
                  const friend = friends.find(f => f.uid === collabUid);
                  return (
                    <div key={collabUid} className="flex items-center gap-3 p-2 border rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                          {friend?.displayName?.charAt(0) || friend?.email.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{friend?.displayName || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{friend?.email || collabUid}</p>
                      </div>
                      <Badge variant="secondary">Collaborator</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Invite Friends */}
          <div>
            <h3 className="font-medium mb-3">Invite Friends</h3>
            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No friends available to invite</p>
                <p className="text-xs">All your friends are already collaborators</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div key={friend.uid} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {friend.displayName?.charAt(0) || friend.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.displayName || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendPlaylistInvite(friend.uid, friend.email)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Find New Users */}
          <div>
            <h3 className="font-medium mb-3">Find New Users</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={searchUsers}
                  disabled={!searchQuery.trim() || isSearching}
                  size="sm"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div key={result.uid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {result.displayName?.charAt(0) || result.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.displayName || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{result.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendPlaylistInvite(result.uid, result.email)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No users found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
