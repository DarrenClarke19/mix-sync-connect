import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  ArrowLeft,
  Loader2,
  Check,
  X
} from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useUserStore, Friend, FriendRequest } from "@/stores/useUserStore";
import { searchUsers, SearchUserResult } from "@/lib/userService";
import { 
  sendFriendRequest as sendFirestoreFriendRequest,
  acceptFriendRequest as acceptFirestoreFriendRequest,
  rejectFriendRequest as rejectFirestoreFriendRequest,
  getFriendRequests as getFirestoreFriendRequests,
  getPendingSentRequests as getFirestorePendingSentRequests,
  getFriends as getFirestoreFriends,
  removeFriend as removeFirestoreFriend,
  listenToFriendRequests,
  listenToFriends
} from "@/lib/friendService";
import { useNavigate } from "react-router-dom";

export const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useFirebaseAuth();
  const navigate = useNavigate();
  
  // Zustand store
  const {
    friends,
    friendRequests,
    pendingSentRequests,
    isLoading,
    isInitialized,
    setFriends,
    setFriendRequests,
    setPendingSentRequests,
    addFriend,
    removeFriend: removeFriendFromStore,
    addFriendRequest,
    removeFriendRequest,
    updateFriendRequest,
    addPendingSentRequest,
    removePendingSentRequest,
    setLoading
  } = useUserStore();

  useEffect(() => {
    if (user && !isInitialized) {
      loadFriends();
      loadFriendRequests();
      
      // Set up real-time listeners
      const unsubscribeFriends = listenToFriends(user.uid, (firestoreFriends) => {
        const friendsData: Friend[] = firestoreFriends.map(f => ({
          uid: f.uid,
          email: f.email,
          displayName: f.displayName,
          photoURL: f.photoURL,
          status: f.status,
          createdAt: f.createdAt,
        }));
        setFriends(friendsData);
      });
      
      const unsubscribeRequests = listenToFriendRequests(user.uid, (firestoreRequests) => {
        const requestsData: FriendRequest[] = firestoreRequests.map(r => ({
          id: r.id,
          fromUid: r.fromUid,
          fromEmail: r.fromEmail,
          fromDisplayName: r.fromDisplayName,
          fromPhotoURL: r.fromPhotoURL,
          toUid: r.toUid,
          status: r.status,
          createdAt: r.createdAt,
        }));
        setFriendRequests(requestsData);
      });
      
      // Cleanup listeners on unmount
      return () => {
        unsubscribeFriends();
        unsubscribeRequests();
      };
    }
  }, [user, isInitialized]);



  const loadFriends = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const firestoreFriends = await getFirestoreFriends(user.uid);
      const friendsData: Friend[] = firestoreFriends.map(f => ({
        uid: f.uid,
        email: f.email,
        displayName: f.displayName,
        photoURL: f.photoURL,
        status: f.status,
        createdAt: f.createdAt,
      }));
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;
    
    try {
      const [requests, pending] = await Promise.all([
        getFirestoreFriendRequests(user.uid),
        getFirestorePendingSentRequests(user.uid)
      ]);
      
      console.log('🔍 Raw Firestore friend requests:', requests);
      console.log('🔍 Raw Firestore pending sent requests:', pending);
      
      const requestsData: FriendRequest[] = requests.map(r => ({
        id: r.id,
        fromUid: r.fromUid,
        fromEmail: r.fromEmail,
        fromDisplayName: r.fromDisplayName,
        fromPhotoURL: r.fromPhotoURL,
        toUid: r.toUid,
        status: r.status,
        createdAt: r.createdAt,
      }));
      
      const pendingData: FriendRequest[] = pending.map(r => ({
        id: r.id,
        fromUid: r.fromUid,
        fromEmail: r.fromEmail,
        fromDisplayName: r.fromDisplayName,
        fromPhotoURL: r.fromPhotoURL,
        toUid: r.toUid,
        status: r.status,
        createdAt: r.createdAt,
      }));
      
      console.log('🔍 Processed friend requests:', requestsData);
      console.log('🔍 Processed pending sent requests:', pendingData);
      
      setFriendRequests(requestsData);
      setPendingSentRequests(pendingData);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      toast.error('Failed to load friend requests');
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Use real Firestore search
      const results = await searchUsers(searchQuery.trim(), user.uid, 20);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No users found for your search');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (toUid: string, userEmail: string, userDisplayName?: string) => {
    if (!user) return;
    
    try {
      // Send real friend request to Firestore
      await sendFirestoreFriendRequest(
        user.uid,
        user.email || '',
        user.displayName || undefined,
        user.photoURL || undefined,
        toUid,
        userEmail,
        userDisplayName
      );
      
      toast.success(`Friend request sent to ${userDisplayName || userEmail}!`);
      
      // Remove from search results to avoid duplicate requests
      setSearchResults(prev => prev.filter(u => u.uid !== toUid));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      // Accept real friend request in Firestore
      await acceptFirestoreFriendRequest(requestId);
      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      // Reject real friend request in Firestore
      await rejectFirestoreFriendRequest(requestId, user.uid);
      toast.success('Friend request rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!user) return;
    
    try {
      // Remove friend from Firestore
      await removeFirestoreFriend(user.uid, friendUid);
      toast.success('Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchUsers();
    }
  };

  const isAlreadyFriend = (uid: string) => {
    return friends.some(f => f.uid === uid && f.status === 'accepted');
  };

  const hasPendingRequest = (uid: string) => {
    return pendingSentRequests.some(r => r.toUid === uid && r.status === 'pending');
  };

  const canSendRequest = (uid: string) => {
    return !isAlreadyFriend(uid) && !hasPendingRequest(uid);
  };

  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Friends</h1>
            <p className="text-muted-foreground">Manage your friends and connections</p>
          </div>
        </div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Requests ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="find" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Find Friends
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
                <CardDescription>
                  People you're connected with and can collaborate with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No friends yet</p>
                    <p className="text-sm">Start by finding and adding friends</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend) => (
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
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Friend</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFriend(friend.uid)}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>
                  People who want to connect with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {friendRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {request.fromDisplayName?.charAt(0) || request.fromEmail.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.fromDisplayName || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{request.fromEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => acceptFriendRequest(request.id)}
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('🔍 Reject button clicked for request:', request);
                              console.log('🔍 Request ID being passed:', request.id);
                              rejectFriendRequest(request.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Find Friends Tab */}
          <TabsContent value="find" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>
                  Search for people by email or name to add as friends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearchUsers}
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
                  <div className="space-y-3">
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
                        <div className="flex items-center gap-2">
                          {isAlreadyFriend(result.uid) ? (
                            <Badge variant="secondary">Already Friends</Badge>
                          ) : hasPendingRequest(result.uid) ? (
                            <Badge variant="outline">Request Sent</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendFriendRequest(result.uid, result.email, result.displayName)}
                              disabled={!canSendRequest(result.uid)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Friend
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No users found for "{searchQuery}"</p>
                    <p className="text-sm">Try searching by email or name</p>
                  </div>
                )}

                <div className="text-center text-xs text-muted-foreground">
                  <p>Search for users by their email address or display name</p>
                  <p>Only public users will appear in search results</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
