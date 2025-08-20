import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/stores/useUserStore';
import { sendPlaylistInvite } from '@/lib/playlistInviteService';
import { searchUsers } from '@/lib/userService';
import { Search, UserPlus, X } from 'lucide-react';

interface InviteFriendModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  playlistName: string;
  currentUserId: string;
  currentUserEmail: string;
  currentUserDisplayName: string;
}

export function InviteFriendModal({
  isOpen,
  onOpenChange,
  playlistId,
  playlistName,
  currentUserId,
  currentUserEmail,
  currentUserDisplayName
}: InviteFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { friends } = useUserStore();

  // Search for users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery, currentUserId, 10);
        // Filter out users who are already friends or collaborators
        const filteredResults = results.filter(user => 
          !friends.some(friend => friend.uid === user.uid)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search failed",
          description: "Could not search for users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentUserId, friends, toast]);

  const handleInviteUser = async (user: any) => {
    if (pendingInvites.has(user.uid)) {
      return; // Already invited
    }

    try {
      setPendingInvites(prev => new Set(prev).add(user.uid));
      
      await sendPlaylistInvite(
        playlistId,
        playlistName,
        currentUserId,
        currentUserEmail,
        currentUserDisplayName || currentUserEmail,
        user.uid
      );

      toast({
        title: "Invitation sent!",
        description: `Invited ${user.displayName || user.email} to "${playlistName}"`,
      });

      // Close modal after successful invite
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Invitation failed",
        description: "Could not send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.uid);
        return newSet;
      });
    }
  };

  const isUserInvited = (userId: string) => pendingInvites.has(userId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends to "{playlistName}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="text-center text-sm text-gray-500">
              Searching...
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.displayName?.[0] || user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.displayName || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleInviteUser(user)}
                    disabled={isUserInvited(user.uid)}
                    className="ml-2"
                  >
                    {isUserInvited(user.uid) ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="text-center text-sm text-gray-500">
              No users found matching "{searchQuery}"
            </div>
          )}

          {/* Current Friends */}
          {friends.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Your Friends</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {friends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.photoURL} />
                        <AvatarFallback>
                          {friend.displayName?.[0] || friend.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">
                          {friend.displayName || 'No name'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {friend.email}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInviteUser(friend)}
                      disabled={isUserInvited(friend.uid)}
                    >
                      {isUserInvited(friend.uid) ? (
                        "Inviting..."
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
