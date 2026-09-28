import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSoftDeleteUser, useHardDeleteUser } from '@/hooks/useAdminActions';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  mode: 'soft' | 'hard';
}

export function DeleteUserDialog({ open, onOpenChange, userId, userName, mode }: DeleteUserDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const softDelete = useSoftDeleteUser();
  const hardDelete = useHardDeleteUser();
  
  const isHard = mode === 'hard';
  const confirmText = 'DELETE USER';
  const canConfirm = isHard ? confirmation === confirmText : true;

  const handleDelete = () => {
    if (!canConfirm) return;
    const mutation = isHard ? hardDelete : softDelete;
    mutation.mutate(userId, {
      onSuccess: () => { onOpenChange(false); setConfirmation(''); },
    });
  };

  const isPending = softDelete.isPending || hardDelete.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setConfirmation(''); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isHard ? <AlertTriangle className="w-5 h-5 text-destructive" /> : <Trash2 className="w-5 h-5 text-destructive" />}
            {isHard ? 'Permanently Delete User' : 'Soft Delete User'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isHard ? (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <p className="text-sm text-destructive font-medium">⚠️ This action is irreversible!</p>
              <p className="text-xs text-muted-foreground mt-1">
                All data for <span className="font-medium">{userName}</span> will be permanently removed including posts, grades, attendance, and settings.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hide <span className="font-medium text-foreground">{userName}</span>'s data from the platform. Their data will be retained for compliance.
            </p>
          )}
          
          {isHard && (
            <div className="space-y-2">
              <Label>Type <span className="font-mono text-destructive">{confirmText}</span> to confirm</Label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={confirmText}
                className="font-mono"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending || !canConfirm}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isHard ? 'Permanently Delete' : 'Soft Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
