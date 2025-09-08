import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { acceptPlaylistInvite, rejectPlaylistInvite, listenToPendingInvites } from '@/services/firebase/playlistInviteService';
import { PlaylistInvite } from '@/services/firebase/playlistInviteService';
import { Check, X, Music } from 'lucide-react';

interface PlaylistInvitesListProps {
  userId: string;
}

export function PlaylistInvitesList({ userId }: PlaylistInvitesListProps) {
  const [invites, setInvites] = useState<PlaylistInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = listenToPendingInvites(userId, (invites) => {
      setInvites(invites);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await acceptPlaylistInvite(inviteId);
      toast({
        title: "Invite accepted!",
        description: "You've been added to the playlist.",
      });
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await rejectPlaylistInvite(inviteId);
      toast({
        title: "Invite rejected",
        description: "The invite has been declined.",
      });
    } catch (error) {
      console.error('Error rejecting invite:', error);
      toast({
        title: "Error",
        description: "Failed to reject invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) {
    return null; // Don't show anything if no invites
  }

  return (
    <Card className="bg-gradient-card border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Playlist Invites ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {invite.fromDisplayName?.charAt(0) || invite.fromEmail.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{invite.fromDisplayName || invite.fromEmail}</p>
                <p className="text-sm text-muted-foreground">invited you to collaborate on</p>
                <p className="font-medium text-primary">{invite.playlistName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectInvite(invite.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="gradient"
                onClick={() => handleAcceptInvite(invite.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
