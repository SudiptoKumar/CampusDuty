import { BookOpen, CheckCircle, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import { AnimatedCounter } from '@/components/shared';

export function QuickStatsTile() {
  const { data: classes } = useClasses();
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();
  
  const stats = [
    {
      label: 'Classes',
      value: classes?.length ?? 0,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Tasks',
      value: tasks?.filter(t => !t.is_completed).length ?? 0,
      icon: Target,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Done',
      value: tasks?.filter(t => t.is_completed).length ?? 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Attend',
      value: attendance?.filter(a => a.status === 'present').length ?? 0,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="col-span-2 relative overflow-hidden rounded-3xl backdrop-blur-xl bg-background/40 border border-white/10 p-4"
    >
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="text-center"
          >
            <div className={`w-10 h-10 mx-auto rounded-xl ${stat.bgColor} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-xl font-bold">
              <AnimatedCounter value={stat.value} />
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
