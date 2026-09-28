import { CalendarDays, BookOpen, FileText, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { subDays, isAfter, isBefore, addDays } from 'date-fns';

export function AgendaSummaryTile() {
  const { data: tasks } = useTasks();
  
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const sevenDaysAhead = addDays(today, 7);
  
  // Get tasks from last 7 days and upcoming 7 days
  const recentTasks = (tasks ?? []).filter(task => {
    const dueDate = new Date(task.due_date);
    return isAfter(dueDate, sevenDaysAgo) && isBefore(dueDate, sevenDaysAhead);
  });
  
  const stats = {
    homework: recentTasks.filter(t => t.type === 'homework' || t.type === 'assignment').length,
    exams: recentTasks.filter(t => t.type === 'exam').length,
    reminders: recentTasks.filter(t => t.type === 'reminder').length,
  };
  
  const totalItems = stats.homework + stats.exams + stats.reminders;
  const completedItems = recentTasks.filter(t => t.is_completed).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-violet-500" />
          </div>
          <span className="font-semibold text-sm">This Week</span>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-xl bg-blue-500/10">
          <BookOpen className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <span className="text-lg font-bold text-blue-500">{stats.homework}</span>
          <p className="text-[9px] text-muted-foreground">Tasks</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-red-500/10">
          <FileText className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <span className="text-lg font-bold text-red-500">{stats.exams}</span>
          <p className="text-[9px] text-muted-foreground">Exams</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-amber-500/10">
          <Bell className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <span className="text-lg font-bold text-amber-500">{stats.reminders}</span>
          <p className="text-[9px] text-muted-foreground">Remind</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedItems}/{totalItems}</span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
          />
        </div>
      </div>
      
      {/* Footer link */}
      <Link 
        to="/agenda" 
        className="flex items-center justify-center gap-1 mt-3 text-xs text-violet-500 font-medium hover:gap-2 transition-all"
      >
        View Agenda <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  );
}
