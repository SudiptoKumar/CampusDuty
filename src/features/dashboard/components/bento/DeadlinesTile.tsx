import { AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export function DeadlinesTile() {
  const { data: tasks } = useTasks();
  const { data: subjects } = useSubjects();
  
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  // Get upcoming uncompleted tasks
  const upcomingTasks = (tasks ?? [])
    .filter(t => !t.is_completed && isAfter(new Date(t.due_date), today) && isBefore(new Date(t.due_date), nextWeek))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);
  
  const getSubject = (id: string | null) => subjects?.find(s => s.id === id);
  
  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };
  
  const getUrgencyColor = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 'text-red-500 bg-red-500/10';
    if (diff <= 3) return 'text-amber-500 bg-amber-500/10';
    return 'text-green-500 bg-green-500/10';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-background/40 border border-white/10 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <span className="font-semibold text-sm">Deadlines</span>
      </div>
      
      {/* Content */}
      {upcomingTasks.length > 0 ? (
        <div className="space-y-2">
          {upcomingTasks.map((task) => {
            const subject = getSubject(task.subject_id);
            
            return (
              <div 
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/40"
              >
                <div 
                  className="w-1.5 h-8 rounded-full"
                  style={{ backgroundColor: subject?.color || '#666' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {subject?.name || 'General'}
                  </p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getUrgencyColor(task.due_date)}`}>
                  {getDaysUntil(task.due_date)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">All clear! 🎉</p>
        </div>
      )}
      
      {/* Footer */}
      <Link 
        to="/agenda" 
        className="flex items-center justify-center gap-1 mt-3 text-xs text-primary font-medium hover:gap-2 transition-all"
      >
        View all <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  );
}
