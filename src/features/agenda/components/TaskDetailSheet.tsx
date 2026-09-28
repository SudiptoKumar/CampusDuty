import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Bell, Circle, CheckCircle2, Trash2, 
  Share2, Copy, Link as LinkIcon, Plus, Paperclip,
  GraduationCap, BookOpen, ClipboardCheck, AlertTriangle,
  Volume2, VolumeX, Pause
} from 'lucide-react';
import { format } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSubjects } from '@/hooks/useSubjects';
import { useToggleTaskComplete, useDeleteTask } from '@/hooks/useTasks';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'exam': return GraduationCap;
    case 'assignment': return ClipboardCheck;
    case 'reminder': return Bell;
    default: return BookOpen;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'exam': return 'Exam';
    case 'assignment': return 'Assignment';
    case 'reminder': return 'Reminder';
    default: return 'Homework';
  }
};

export function TaskDetailSheet({ task, open, onOpenChange, onEdit }: TaskDetailSheetProps) {
  const { data: subjects } = useSubjects();
  const toggleTask = useToggleTaskComplete();
  const deleteTask = useDeleteTask();
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useTextToSpeech();
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('campus-duty-tts-enabled') !== 'false');

  // Listen for TTS toggle changes from Settings
  useEffect(() => {
    const handler = () => setTtsEnabled(localStorage.getItem('campus-duty-tts-enabled') !== 'false');
    window.addEventListener('tts-toggle', handler);
    return () => window.removeEventListener('tts-toggle', handler);
  }, []);

  // Stop speech when sheet closes
  useEffect(() => {
    if (!open) stop();
  }, [open, stop]);
  
  if (!task) return null;
  
  const subject = subjects?.find(s => s.id === task.subject_id);
  const TypeIcon = getTypeIcon(task.type);
  const subtasks: SubtaskItem[] = Array.isArray(task.subtasks) 
    ? (task.subtasks as unknown as SubtaskItem[])
    : [];
  
  const handleToggleComplete = () => {
    toggleTask.mutate({ 
      id: task.id, 
      is_completed: !task.is_completed 
    });
  };
  
  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[90vh] rounded-t-3xl p-0 overflow-hidden"
        hideCloseButton
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col h-full"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>
          
          {/* Close button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {/* Title section with checkbox */}
            <div className="flex items-start gap-4 pt-4 pb-6">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="pt-1"
              >
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={handleToggleComplete}
                  className="w-6 h-6 rounded-full border-2"
                />
              </motion.div>
              <div className="flex-1">
                <h2 className={cn(
                  "text-xl font-bold",
                  task.is_completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h2>
                {task.priority === 'high' && !task.is_completed && (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    High priority
                  </span>
                )}
              </div>
            </div>
            
            {/* Info rows */}
            <div className="space-y-1">
              {/* Date */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 py-3"
              >
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(task.due_date), 'EEE, d MMMM')}
                  {task.due_time && ` at ${task.due_time}`}
                </span>
              </motion.div>
              
              <Separator className="bg-border/50" />
              
              {/* Type */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-4 py-3"
              >
                <TypeIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{getTypeLabel(task.type)}</span>
              </motion.div>
              
              <Separator className="bg-border/50" />
              
              {/* Reminder */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 py-3"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Remind me</span>
              </motion.div>
              
              <Separator className="bg-border/50" />
              
              {/* Subject/Color */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-4 py-3"
              >
                <div 
                  className="w-5 h-5 rounded-full border-2 border-muted"
                  style={{ backgroundColor: subject?.color || 'hsl(var(--muted))' }}
                />
                <span className="text-sm">
                  {subject?.name || 'No subject'}
                </span>
              </motion.div>
              
              <Separator className="bg-border/50" />
              
              {/* Attachments */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 py-3"
              >
                <Paperclip className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add attachments</span>
              </motion.div>
            </div>
            
            <Separator className="bg-border/50 my-3" />
            
            {/* Notes */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="py-3"
            >
              {task.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{task.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Add a note</p>
              )}
            </motion.div>
            
            <Separator className="bg-border/50 my-3" />
            
            {/* Subtasks section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-2"
            >
              <div className="flex items-center gap-3 py-2 text-muted-foreground mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Subtasks</span>
              </div>
              
              {subtasks.length > 0 ? (
                <div className="space-y-2 pl-2">
                  {subtasks.map((subtask, i) => (
                    <motion.div 
                      key={subtask.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.05 }}
                      className="flex items-center gap-3 py-2"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        className="w-5 h-5"
                      />
                      <span className={cn(
                        "text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : null}
              
              <button className="flex items-center gap-3 py-2 text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Add subtask</span>
              </button>
            </motion.div>
          </div>
          
          {/* Bottom action bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between px-5 py-4 bg-muted/30 border-t border-border/50"
          >
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground"
              >
                <Copy className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            {ttsEnabled && isSupported && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-muted-foreground",
                  isSpeaking && "text-primary"
                )}
                onClick={() => {
                  if (isSpeaking && !isPaused) {
                    pause();
                  } else if (isPaused) {
                    resume();
                  } else {
                    const text = [task.title, task.notes].filter(Boolean).join('. ');
                    speak(text);
                  }
                }}
                title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Read task aloud'}
              >
                {isSpeaking ? (isPaused ? <Volume2 className="w-5 h-5" /> : <Pause className="w-5 h-5" />) : <Volume2 className="w-5 h-5" />}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
