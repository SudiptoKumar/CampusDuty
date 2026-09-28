import { useState } from 'react';
import { Ban, Loader2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBlockUser } from '@/hooks/useAdminActions';

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function BlockUserDialog({ open, onOpenChange, userId, userName }: BlockUserDialogProps) {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const blockUser = useBlockUser();

  const handleBlock = () => {
    blockUser.mutate(
      { userId, reason: reason || undefined, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined },
      { onSuccess: () => { onOpenChange(false); setReason(''); setExpiresAt(''); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Block User
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Block <span className="font-medium text-foreground">{userName}</span> from accessing the platform.
          </p>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for blocking this user..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expires At (optional)
            </Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave empty for permanent block</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleBlock} disabled={blockUser.isPending}>
            {blockUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Block User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
