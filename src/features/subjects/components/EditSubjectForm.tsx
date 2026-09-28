import { useState } from 'react';
import { useUpdateSubject } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/shared/ColorPicker';
import type { Database } from '@/integrations/supabase/types';

type Subject = Database['public']['Tables']['subjects']['Row'];

interface EditSubjectFormProps {
  subject: Subject;
  onClose: () => void;
}

export function EditSubjectForm({ subject, onClose }: EditSubjectFormProps) {
  const updateSubject = useUpdateSubject();
  const { data: teachers } = useTeachers();
  
  const [name, setName] = useState(subject.name);
  const [room, setRoom] = useState(subject.room || '');
  const [color, setColor] = useState(subject.color);
  const [teacherId, setTeacherId] = useState(subject.teacher_id || 'none');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    await updateSubject.mutateAsync({
      id: subject.id,
      name: name.trim(),
      room: room.trim() || null,
      color,
      teacher_id: teacherId === 'none' ? null : teacherId,
    });
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Subject Name</Label>
        <Input
          id="name"
          placeholder="e.g., Mathematics"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="room">Room (Optional)</Label>
        <Input
          id="room"
          placeholder="e.g., Room 301"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
      </div>
      
      {teachers && teachers.length > 0 && (
        <div className="space-y-2">
          <Label>Teacher (Optional)</Label>
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Teacher</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!name.trim() || updateSubject.isPending}
        >
          {updateSubject.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
