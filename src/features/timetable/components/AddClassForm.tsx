import { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { useCreateClass } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DAY_NAMES } from '@/lib/mockData';
import type { Database } from '@/integrations/supabase/types';

type ClassType = Database['public']['Enums']['class_type'];
type RecurrenceType = Database['public']['Enums']['recurrence_type'];

interface AddClassFormProps {
  onClose: () => void;
}

export function AddClassForm({ onClose }: AddClassFormProps) {
  const { data: subjects } = useSubjects();
  const createClass = useCreateClass();
  
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState('0'); // Default to Sunday (0)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [type, setType] = useState<ClassType>('lecture');
  const [room, setRoom] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectId) return;
    
    await createClass.mutateAsync({
      subject_id: subjectId,
      day: parseInt(day),
      start_time: startTime,
      end_time: endTime,
      type,
      room: room.trim() || null,
      recurrence: 'weekly' as RecurrenceType,
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
        {(!subjects || subjects.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Add a subject first before creating classes.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Day</Label>
        <Select value={day} onValueChange={setDay}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Show all 7 days (Sunday to Saturday) */}
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
          disabled={!subjectId || createClass.isPending}
        >
          {createClass.isPending ? 'Adding...' : 'Add Class'}
        </Button>
      </div>
    </form>
  );
}
