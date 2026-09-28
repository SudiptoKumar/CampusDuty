import { useMemo } from 'react';
import { TrendingUp, BookOpen, FileText, Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useClasses } from '@/hooks/useClasses';
import { isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns';

export function WeeklyReportTile() {
  const navigate = useNavigate();
  const { data: tasks } = useTasks();
  const { data: classes } = useClasses();
  
  const today = startOfDay(new Date());
  const weekEnd = endOfDay(addDays(today, 7));
  
  // Count upcoming tasks by type
  const upcomingTasks = (tasks ?? []).filter(task => {
    const dueDate = new Date(task.due_date);
    return isAfter(dueDate, today) && isBefore(dueDate, weekEnd) && !task.is_completed;
  });
  
  const exams = upcomingTasks.filter(t => t.type === 'exam').length;
  const homework = upcomingTasks.filter(t => t.type === 'homework').length;
  const assignments = upcomingTasks.filter(t => t.type === 'assignment').length;
  const reminders = upcomingTasks.filter(t => t.type === 'reminder').length;
  
  // Fix: Count class sessions for next 7 days (not total classes in DB)
  const weekClassCount = useMemo(() => {
    if (!classes) return 0;
    
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();
      const dayClasses = classes.filter(c => c.day === dayOfWeek);
      count += dayClasses.length;
    }
    
    return count;
  }, [classes, today]);
  
  const completedTasks = (tasks ?? []).filter(t => t.is_completed).length;
  
  const stats = [
    { label: 'Classes', value: weekClassCount, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', route: '/timetable' },
    { label: 'Exams', value: exams, icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10', route: '/agenda' },
    { label: 'Tasks', value: homework + assignments, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10', route: '/agenda' },
    { label: 'Reminders', value: reminders, icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10', route: '/agenda' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full relative overflow-hidden liquid-glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-base">Weekly Overview</h3>
            <p className="text-xs text-muted-foreground">
              {upcomingTasks.length} pending · {completedTasks} completed
            </p>
          </div>
        </div>
        <Link 
          to="/agenda" 
          aria-label="View all tasks in agenda"
          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          View All <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      
      {/* Stats Grid - Clickable */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
            onClick={() => navigate(stat.route)}
            aria-label={`${stat.value} ${stat.label}. Click to view details`}
            className={`flex flex-col items-center p-3 rounded-2xl ${stat.bg} hover:scale-105 active:scale-95 transition-transform cursor-pointer`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} aria-hidden="true" />
            <span className={`text-xl font-bold ${stat.color}`} aria-hidden="true">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground" aria-hidden="true">{stat.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
