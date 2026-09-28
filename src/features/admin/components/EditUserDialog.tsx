import { useState, useEffect } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUpdateProfile } from '@/hooks/useAdminActions';
import { Constants } from '@/integrations/supabase/types';

const FACULTIES = Constants.public.Enums.faculty_type;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentFaculty?: string | null;
  currentSemester?: number | null;
}

export function EditUserDialog({ open, onOpenChange, userId, userName, currentFaculty, currentSemester }: EditUserDialogProps) {
  const [name, setName] = useState(userName);
  const [bio, setBio] = useState('');
  const [faculty, setFaculty] = useState(currentFaculty || '');
  const [semester, setSemester] = useState(currentSemester?.toString() || '');
  const updateProfile = useAdminUpdateProfile();

  useEffect(() => {
    setName(userName);
    setFaculty(currentFaculty || '');
    setSemester(currentSemester?.toString() || '');
  }, [userName, currentFaculty, currentSemester]);

  const handleSave = () => {
    updateProfile.mutate(
      {
        userId,
        name: name !== userName ? name : undefined,
        bio: bio || undefined,
        faculty: faculty || undefined,
        semester: semester ? parseInt(semester) : undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit User Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Update bio..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {FACULTIES.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => (
                    <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
