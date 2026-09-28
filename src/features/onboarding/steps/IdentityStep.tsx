import { useState } from 'react';
import { AtSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Props {
  profile: Profile;
  onNext: () => void;
}

export function IdentityStep({ profile, onNext }: Props) {
  const updateProfile = useUpdateProfile();
  const [username, setUsername] = useState(profile.username || '');
  const [classId, setClassId] = useState(profile.class_id || '');
  const [regNumber, setRegNumber] = useState(profile.reg_number || '');

  const handleSave = async () => {
    const updates: any = {};
    if (username.trim()) updates.username = username.trim().toLowerCase();
    if (classId.trim()) updates.class_id = classId.trim();
    if (regNumber.trim()) updates.reg_number = regNumber.trim();
    
    try {
      if (Object.keys(updates).length > 0) {
        await updateProfile.mutateAsync(updates);
      }
      onNext();
    } catch {
      toast.error('Failed to save, please try again');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center mb-3">
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent-lavender)/0.15)] flex items-center justify-center">
          <AtSign className="w-7 h-7 text-[hsl(var(--accent-lavender))]" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-1">Your Identity</h2>
      <p className="text-muted-foreground text-sm text-center mb-8">
        Set a username to share your profile
      </p>

      <div className="space-y-5 mb-8">
        <div className="space-y-2">
          <Label>Username</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={30}
              className="h-12 pl-9 rounded-xl bg-muted/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Class ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            placeholder="e.g. CSE-2024-A"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="h-12 rounded-xl bg-muted/50"
          />
        </div>

        <div className="space-y-2">
          <Label>Registration Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            placeholder="e.g. 2024-CSE-001"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            className="h-12 rounded-xl bg-muted/50"
          />
        </div>
      </div>

      <Button 
        onClick={handleSave}
        disabled={updateProfile.isPending}
        className="w-full h-12 rounded-xl text-base font-semibold"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-lavender)) 100%)',
        }}
      >
        {updateProfile.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Continue'}
      </Button>
    </div>
  );
}
