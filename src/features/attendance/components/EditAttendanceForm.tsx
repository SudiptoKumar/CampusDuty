import { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import { useUpdateAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];
type AttendanceStatus = Database['public']['Enums']['attendance_status'];

interface EditAttendanceFormProps {
  attendance: Attendance;
  onClose: () => void;
}

export function EditAttendanceForm({ attendance, onClose }: EditAttendanceFormProps) {
  const { data: subjects } = useSubjects();
  const { data: classes } = useClasses();
  const updateAttendance = useUpdateAttendance();
  
  const [subjectId, setSubjectId] = useState(attendance.subject_id);
  const [classId, setClassId] = useState(attendance.class_id || 'none');
  const [date, setDate] = useState(attendance.date);
  const [status, setStatus] = useState<AttendanceStatus>(attendance.status);
  const [excused, setExcused] = useState(attendance.excused);
  const [notes, setNotes] = useState(attendance.notes || '');
  
  // Filter classes by selected subject
  const filteredClasses = classes?.filter((c) => c.subject_id === subjectId) ?? [];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectId || !date) return;
    
    await updateAttendance.mutateAsync({
      id: attendance.id,
      subject_id: subjectId,
      class_id: classId === 'none' ? null : classId,
      date,
      status,
      excused,
      notes: notes.trim() || null,
    });
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setClassId('none'); }}>
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
      
      {filteredClasses.length > 0 && (
        <div className="space-y-2">
          <Label>Class (Optional)</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General</SelectItem>
              {filteredClasses.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.type} - {classItem.start_time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="tardy">Tardy</SelectItem>
            <SelectItem value="left_early">Left Early</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {status !== 'present' && (
        <div className="flex items-center justify-between">
          <div>
            <Label>Excused</Label>
            <p className="text-sm text-muted-foreground">Mark as excused absence</p>
          </div>
          <Switch checked={excused} onCheckedChange={setExcused} />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!subjectId || !date || updateAttendance.isPending}
        >
          {updateAttendance.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
