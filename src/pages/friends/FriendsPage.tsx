import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [friends] = useState([
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex@example.com",
      status: "online",
      playlists: 5,
      lastActive: "2 minutes ago"
    },
    {
      id: "2", 
      name: "Maya Chen",
      email: "maya@example.com",
      status: "offline",
      playlists: 3,
      lastActive: "1 hour ago"
    },
    {
      id: "3",
      name: "Jordan Smith",
      email: "jordan@example.com", 
      status: "online",
      playlists: 7,
      lastActive: "5 minutes ago"
    }
  ]);

  const [pendingRequests] = useState([
    {
      id: "1",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      sentAt: "2 hours ago"
    }
  ]);

  const handleAddFriend = () => {
    toast.info("Add friend functionality coming soon!");
  };

  const handleAcceptRequest = (requestId: string) => {
    toast.success("Friend request accepted!");
  };

  const handleRejectRequest = (requestId: string) => {
    toast.info("Friend request rejected");
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">Manage your friends and collaborations</p>
      </div>

      {/* Add Friend Section */}
      <Card className="bg-gradient-card border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter friend's email address"
              className="flex-1"
            />
            <Button onClick={handleAddFriend} variant="gradient">
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-gradient-card border border-border/50">
          <CardHeader>
            <CardTitle>Pending Friend Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {request.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <p className="text-xs text-muted-foreground">Sent {request.sentAt}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                    Reject
                  </Button>
                  <Button size="sm" variant="gradient" onClick={() => handleAcceptRequest(request.id)}>
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card className="bg-gradient-card border border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Friends ({friends.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No friends found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {friend.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {friend.playlists} playlists
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {friend.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                    <Button size="sm" variant="gradient">
                      Collaborate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
