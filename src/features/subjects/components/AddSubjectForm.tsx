import { useState } from 'react';
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SUBJECT_COLORS } from '@/lib/mockData';

interface AddSubjectFormProps {
  onClose: () => void;
}

export function AddSubjectForm({ onClose }: AddSubjectFormProps) {
  const createSubject = useCreateSubject();
  const { data: teachers } = useTeachers();
  
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0].value);
  const [teacherId, setTeacherId] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    await createSubject.mutateAsync({
      name: name.trim(),
      room: room.trim() || null,
      color,
      teacher_id: teacherId || null,
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
          disabled={!name.trim() || createSubject.isPending}
        >
          {createSubject.isPending ? 'Adding...' : 'Add Subject'}
        </Button>
      </div>
    </form>
  );
}
