import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export function MonthProgressTile() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  const totalDays = differenceInDays(monthEnd, monthStart) + 1;
  const daysPassed = differenceInDays(today, monthStart) + 1;
  const progress = (daysPassed / totalDays) * 100;
  const daysRemaining = totalDays - daysPassed;
  
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
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="font-semibold text-sm">{format(today, 'MMMM yyyy')}</span>
        </div>
        <span className="text-lg font-bold text-emerald-500">{Math.round(progress)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div 
        className="relative h-3 bg-muted/50 rounded-full overflow-hidden mb-3"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Month progress: ${Math.round(progress)}% complete`}
      >
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
        />
      </div>
      
      {/* Stats */}
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          Day <span className="font-medium text-foreground">{daysPassed}</span> of {totalDays}
        </span>
        <span className="text-emerald-500 font-medium">
          {daysRemaining} days left
        </span>
      </div>
    </motion.div>
  );
}
