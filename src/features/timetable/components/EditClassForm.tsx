import { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { useUpdateClass } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DAY_NAMES } from '@/lib/mockData';
import type { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];
type ClassType = Database['public']['Enums']['class_type'];

interface EditClassFormProps {
  classItem: TimetableClass;
  onClose: () => void;
}

export function EditClassForm({ classItem, onClose }: EditClassFormProps) {
  const { data: subjects } = useSubjects();
  const updateClass = useUpdateClass();
  
  const [subjectId, setSubjectId] = useState(classItem.subject_id);
  const [day, setDay] = useState(classItem.day.toString());
  const [startTime, setStartTime] = useState(classItem.start_time);
  const [endTime, setEndTime] = useState(classItem.end_time);
  const [type, setType] = useState<ClassType>(classItem.type);
  const [room, setRoom] = useState(classItem.room || '');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectId) return;
    
    await updateClass.mutateAsync({
      id: classItem.id,
      subject_id: subjectId,
      day: parseInt(day),
      start_time: startTime,
      end_time: endTime,
      type,
      room: room.trim() || null,
    });
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects?.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: subject.color }} 
                  />
                  {subject.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Day</Label>
        <Select value={day} onValueChange={setDay}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_NAMES.map((name, index) => (
              <SelectItem key={index} value={index.toString()}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as ClassType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lecture">Lecture</SelectItem>
            <SelectItem value="lab">Lab</SelectItem>
            <SelectItem value="seminar">Seminar</SelectItem>
            <SelectItem value="tutorial">Tutorial</SelectItem>
          </SelectContent>
        </Select>
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
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!subjectId || updateClass.isPending}
        >
          {updateClass.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
