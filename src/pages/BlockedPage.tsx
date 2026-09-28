import { Ban, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface BlockedPageProps {
  reason?: string | null;
  expiresAt?: string | null;
}

export default function BlockedPage({ reason, expiresAt }: BlockedPageProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Ban className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Account Suspended</h1>
          <p className="text-muted-foreground mt-2">
            Your account has been suspended by an administrator.
          </p>
        </div>
        {reason && (
          <div className="p-4 rounded-xl bg-muted/50 text-left">
            <p className="text-sm font-medium mb-1">Reason:</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>
        )}
        {expiresAt && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Expires: {format(new Date(expiresAt), 'PPp')}</span>
          </div>
        )}
        {!expiresAt && (
          <p className="text-xs text-muted-foreground">This suspension is permanent. Contact support if you believe this is an error.</p>
        )}
        <Button variant="outline" onClick={handleLogout} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
