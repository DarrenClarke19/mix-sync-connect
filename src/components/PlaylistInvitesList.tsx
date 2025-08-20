import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { acceptPlaylistInvite, rejectPlaylistInvite, listenToPendingInvites } from '@/lib/playlistInviteService';
import { PlaylistInvite } from '@/lib/playlistInviteService';
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

    try {
      const unsubscribe = listenToPendingInvites(userId, (pendingInvites) => {
        setInvites(pendingInvites);
        setLoading(false);
      });

      // Set a timeout to stop loading if no response
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      return () => {
        unsubscribe();
        clearTimeout(timeoutId);
      };
    } catch (error) {
      console.error('Error setting up invitation listener:', error);
      setLoading(false);
    }
  }, [userId]);

  const handleAcceptInvite = async (invite: PlaylistInvite) => {
    try {
      await acceptPlaylistInvite(invite.id);
      toast.success(`Joined "${invite.playlistName}" playlist!`);
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (invite: PlaylistInvite) => {
    try {
      await rejectPlaylistInvite(invite.id);
      toast.success('Invitation declined');
    } catch (error) {
      console.error('Error rejecting invite:', error);
      toast.error('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No pending playlist invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Playlist Invitations ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={invite.fromPhotoURL} />
                  <AvatarFallback>
                    {invite.fromDisplayName?.[0] || invite.fromEmail[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {invite.fromDisplayName || invite.fromEmail}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    invited you to "{invite.playlistName}"
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvite(invite)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectInvite(invite)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
