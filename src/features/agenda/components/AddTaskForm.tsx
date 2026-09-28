import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Bell, Palette, Paperclip, FileText, ListChecks, ChevronRight, Repeat } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useCreateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DatePickerSheet } from './DatePickerSheet';
import { TimePickerSheet } from './TimePickerSheet';
import type { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];
type TaskPriority = Database['public']['Enums']['task_priority'];

interface AddTaskFormProps {
  onClose: () => void;
  defaultType?: string | null;
}

// Preset colors for tasks
const TASK_COLORS = [
  { name: 'Coral', value: '#F97316' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#EAB308' },
];

function formatTimeDisplay(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function AddTaskForm({ onClose, defaultType }: AddTaskFormProps) {
  const { data: subjects } = useSubjects();
  const createTask = useCreateTask();
  
  const getInitialType = (): TaskType => {
    if (defaultType === 'reminder') return 'reminder';
    if (defaultType === 'exam') return 'exam';
    if (defaultType === 'homework') return 'homework';
    if (defaultType === 'assignment') return 'assignment';
    return 'homework';
  };
  
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState('');
  const [type] = useState<TaskType>(getInitialType());
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
  
  // Sheet states
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !dueDate) return;
    
    await createTask.mutateAsync({
      title: title.trim(),
      subject_id: subjectId && subjectId !== 'none' ? subjectId : null,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      due_time: dueTime || null,
      type,
      priority,
      notes: notes.trim() || null,
      is_completed: false,
      subtasks: [],
      attachments: [],
      recurrence_rule: recurrenceRule,
    });
    
    onClose();
  };
  
  const getTypeLabel = () => {
    switch (type) {
      case 'reminder': return 'Reminder';
      case 'exam': return 'Exam';
      case 'homework': return 'Homework';
      case 'assignment': return 'Assignment';
      default: return 'Task';
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Title Input - Clean, minimal */}
      <div className="px-1 py-2">
        <Input
          placeholder="Add a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg border-0 px-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/60"
          autoFocus
        />
      </div>
      
      {/* Action Items - List style */}
      <div className="flex-1 space-y-1 py-4">
        {/* Date Selection */}
        <button
          type="button"
          onClick={() => setDateSheetOpen(true)}
          className={cn(
            'w-full flex items-center gap-4 px-1 py-3 rounded-xl transition-colors hover:bg-muted/40',
            dueDate && 'text-foreground'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            dueDate ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            <CalendarDays className="w-5 h-5" />
          </div>
          <span className={cn('flex-1 text-left', !dueDate && 'text-muted-foreground')}>
            {dueDate ? format(dueDate, 'EEEE, MMM d, yyyy') : 'Add date'}
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </button>
        
        {/* Time/Reminder Selection */}
        <button
          type="button"
          onClick={() => setTimeSheetOpen(true)}
          className={cn(
            'w-full flex items-center gap-4 px-1 py-3 rounded-xl transition-colors hover:bg-muted/40',
            dueTime && 'text-foreground'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            dueTime ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            <Bell className="w-5 h-5" />
          </div>
          <span className={cn('flex-1 text-left', !dueTime && 'text-muted-foreground')}>
            {dueTime ? `Remind me at ${formatTimeDisplay(dueTime)}` : 'Remind me'}
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </button>
        
        {/* Color Picker */}
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-full flex items-center gap-4 px-1 py-3 rounded-xl transition-colors hover:bg-muted/40"
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            selectedColor ? '' : 'bg-muted text-muted-foreground'
          )} style={selectedColor ? { backgroundColor: selectedColor + '20' } : undefined}>
            <Palette className="w-5 h-5" style={selectedColor ? { color: selectedColor } : undefined} />
          </div>
          <span className={cn('flex-1 text-left', !selectedColor && 'text-muted-foreground')}>
            {selectedColor ? 'Color selected' : 'Pick a color'}
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </button>
        
        {showColorPicker && (
          <div className="flex gap-2 px-14 py-2">
            {TASK_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  setSelectedColor(color.value);
                  setShowColorPicker(false);
                }}
                className={cn(
                  'w-8 h-8 rounded-full transition-transform hover:scale-110',
                  selectedColor === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        )}
        
        {/* Subject Selection (for homework/exam) */}
        {(type === 'homework' || type === 'exam' || type === 'assignment') && subjects && subjects.length > 0 && (
          <div className="px-1 py-3">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="h-auto py-3 rounded-xl border-0 bg-muted/40 hover:bg-muted/60">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <ListChecks className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <SelectValue placeholder="Link to subject (optional)" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Subject</SelectItem>
                {subjects.map((subject) => (
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
        )}
        
        {/* Recurrence */}
        <button
          type="button"
          onClick={() => setShowRecurrence(!showRecurrence)}
          className="w-full flex items-center gap-4 px-1 py-3 rounded-xl transition-colors hover:bg-muted/40"
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            recurrenceRule ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            <Repeat className="w-5 h-5" />
          </div>
          <span className={cn('flex-1 text-left', !recurrenceRule && 'text-muted-foreground')}>
            {recurrenceRule ? `Repeats ${recurrenceRule}` : 'Repeat'}
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </button>
        
        {showRecurrence && (
          <div className="flex gap-2 px-14 py-2">
            {[
              { label: 'None', value: null },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  setRecurrenceRule(option.value);
                  setShowRecurrence(false);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  recurrenceRule === option.value
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Attachments Placeholder */}
        <button
          type="button"
          className="w-full flex items-center gap-4 px-1 py-3 rounded-xl transition-colors hover:bg-muted/40 text-muted-foreground"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Paperclip className="w-5 h-5" />
          </div>
          <span className="flex-1 text-left">Add attachments</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </button>
        
        {/* Notes */}
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center gap-4 px-1 py-3 rounded-xl transition-colors hover:bg-muted/40"
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            notes ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            <FileText className="w-5 h-5" />
          </div>
          <span className={cn('flex-1 text-left', !notes && 'text-muted-foreground')}>
            {notes ? 'Note added' : 'Add a note'}
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </button>
        
        {showNotes && (
          <div className="px-1 py-2">
            <Textarea
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl bg-muted/40 border-0 focus-visible:ring-1"
            />
          </div>
        )}
        
        {/* Priority (Hidden but can be added if needed) */}
        <div className="px-1 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                    priority === p 
                      ? p === 'high' 
                        ? 'bg-red-500/20 text-red-500' 
                        : p === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-600'
                          : 'bg-green-500/20 text-green-600'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="flex gap-3 pt-4 border-t border-border/30">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!title.trim() || !dueDate || createTask.isPending}
        >
          {createTask.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
      
      {/* Bottom Sheets */}
      <DatePickerSheet
        open={dateSheetOpen}
        onOpenChange={setDateSheetOpen}
        value={dueDate}
        onSelect={setDueDate}
      />
      
      <TimePickerSheet
        open={timeSheetOpen}
        onOpenChange={setTimeSheetOpen}
        value={dueTime}
        onSelect={setDueTime}
      />
    </form>
  );
}
