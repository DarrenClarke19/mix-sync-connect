import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";

interface InviteFriendModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  playlistName: string;
}

export const InviteFriendModal = ({ 
  isOpen, 
  onOpenChange, 
  playlistId, 
  playlistName 
}: InviteFriendModalProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement actual invite functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success(`Invite sent to ${email}!`);
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error("Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-card border border-border/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <UserPlus className="w-4 h-4 text-primary-foreground" />
            </div>
            Invite Friend to "{playlistName}"
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleInvite} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="friend-email">Friend's Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="friend-email"
                type="email"
                placeholder="Enter friend's email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="gradient" 
              className="flex-1" 
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
