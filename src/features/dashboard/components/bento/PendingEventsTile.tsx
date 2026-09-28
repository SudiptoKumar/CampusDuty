import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { isToday, isTomorrow } from 'date-fns';

interface PendingEventsTileProps {
  variant?: 'today' | 'tomorrow';
}

export function PendingEventsTile({ variant = 'today' }: PendingEventsTileProps) {
  const { data: tasks } = useTasks();
  const { data: subjects } = useSubjects();
  
  // Filter tasks based on variant
  const relevantTasks = (tasks ?? []).filter(task => {
    const dueDate = new Date(task.due_date);
    if (variant === 'today') {
      return isToday(dueDate) && !task.is_completed;
    } else {
      return isTomorrow(dueDate) && !task.is_completed;
    }
  });
  
  const getSubject = (id: string | null) => subjects?.find(s => s.id === id);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return '📝';
      case 'homework': return '📚';
      case 'assignment': return '📋';
      case 'reminder': return '🔔';
      default: return '📌';
    }
  };
  
  const getTypeBg = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 dark:bg-red-500/20';
      case 'homework': return 'bg-blue-100 dark:bg-blue-500/20';
      case 'assignment': return 'bg-purple-100 dark:bg-purple-500/20';
      case 'reminder': return 'bg-amber-100 dark:bg-amber-500/20';
      default: return 'bg-muted/50';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden liquid-glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <span className="font-semibold text-sm">Pending</span>
        </div>
        <Link 
          to="/agenda"
          aria-label="View all pending events in agenda"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      
      {/* Content */}
      {relevantTasks.length > 0 ? (
        <div className="space-y-2">
          {relevantTasks.slice(0, 3).map((task, index) => {
            const subject = getSubject(task.subject_id);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${getTypeBg(task.type)}`}
              >
                <span className="text-lg">{getTypeIcon(task.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {subject?.name || 'General'}
                  </p>
                </div>
              </motion.div>
            );
          })}
          
          {relevantTasks.length > 3 && (
            <Link 
              to="/agenda" 
              aria-label={`View ${relevantTasks.length - 3} more pending events`}
              className="block text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              +{relevantTasks.length - 3} more
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-6 px-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-green-500/10 flex items-center justify-center">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">No pending events</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {variant === 'today' ? 'Enjoy your day!' : 'Tomorrow looks clear!'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
