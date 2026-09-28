import { Calendar, BookOpen, FileText, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { addDays, isAfter, isBefore, startOfToday, endOfDay } from 'date-fns';

export function ThisWeekTile() {
  const { data: tasks } = useTasks();
  
  const today = startOfToday();
  const weekEnd = endOfDay(addDays(today, 7));
  
  // Count tasks by type for this week
  const weekTasks = (tasks ?? []).filter(task => {
    const dueDate = new Date(task.due_date);
    return !task.is_completed && isAfter(dueDate, today) && isBefore(dueDate, weekEnd);
  });
  
  const taskCount = weekTasks.filter(t => t.type === 'homework' || t.type === 'assignment').length;
  const examCount = weekTasks.filter(t => t.type === 'exam').length;
  const reminderCount = weekTasks.filter(t => t.type === 'reminder').length;
  
  const stats = [
    { label: 'Tasks', count: taskCount, icon: BookOpen, color: 'bg-blue-100 dark:bg-blue-500/20', textColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Exams', count: examCount, icon: FileText, color: 'bg-red-100 dark:bg-red-500/20', textColor: 'text-red-600 dark:text-red-400' },
    { label: 'Remind', count: reminderCount, icon: Bell, color: 'bg-amber-100 dark:bg-amber-500/20', textColor: 'text-amber-600 dark:text-amber-400' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-4"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.1) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <span className="font-bold text-base">This Week</span>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between gap-2">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl ${stat.color}`}
            >
              <Icon className={`w-5 h-5 ${stat.textColor}`} />
              <span className={`text-xl font-bold ${stat.textColor}`}>{stat.count}</span>
              <span className={`text-[10px] font-medium ${stat.textColor}`}>{stat.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
