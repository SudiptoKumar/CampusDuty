import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FacultyType = Database['public']['Enums']['faculty_type'];

interface Props {
  profile: Profile;
  onNext: () => void;
}

const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

export function AcademicStep({ profile, onNext }: Props) {
  const updateProfile = useUpdateProfile();
  const [faculty, setFaculty] = useState<FacultyType | ''>(profile.faculty || '');
  const [semester, setSemester] = useState<string>(profile.semester?.toString() || '');

  const handleSave = async () => {
    const updates: any = {};
    if (faculty) updates.faculty = faculty;
    if (semester) updates.semester = parseInt(semester);
    
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
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent-sky)/0.15)] flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-[hsl(var(--accent-sky))]" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-1">Academic Info</h2>
      <p className="text-muted-foreground text-sm text-center mb-8">
        This helps you access your Classroom Hub
      </p>

      <div className="space-y-5 mb-8">
        <div className="space-y-2">
          <Label>Faculty</Label>
          <Select value={faculty} onValueChange={(v) => setFaculty(v as FacultyType)}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50">
              <SelectValue placeholder="Select your faculty" />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              {Constants.public.Enums.faculty_type.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              {semesters.map((s) => (
                <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
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
