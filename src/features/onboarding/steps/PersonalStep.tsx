import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Props {
  profile: Profile;
  onNext: () => void;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PersonalStep({ profile, onNext }: Props) {
  const updateProfile = useUpdateProfile();
  const [bio, setBio] = useState(profile.bio || '');
  const [bloodGroup, setBloodGroup] = useState(profile.blood_group || '');

  const handleSave = async () => {
    const updates: any = {};
    if (bio.trim()) updates.bio = bio.trim();
    if (bloodGroup) updates.blood_group = bloodGroup;
    
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
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent-rose)/0.15)] flex items-center justify-center">
          <Heart className="w-7 h-7 text-[hsl(var(--accent-rose))]" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-1">Personal Touch</h2>
      <p className="text-muted-foreground text-sm text-center mb-8">
        These are totally optional – add what you like
      </p>

      <div className="space-y-5 mb-8">
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            className="rounded-xl bg-muted/50 resize-none"
          />
          <span className="text-xs text-muted-foreground">{bio.length}/200</span>
        </div>

        <div className="space-y-2">
          <Label>Blood Group</Label>
          <Select value={bloodGroup} onValueChange={setBloodGroup}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50">
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              {bloodGroups.map((bg) => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
