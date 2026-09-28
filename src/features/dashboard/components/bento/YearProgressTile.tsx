import { TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { startOfYear, differenceInDays, getWeek } from 'date-fns';

export function YearProgressTile() {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const daysPassed = differenceInDays(today, yearStart) + 1;
  const progress = (daysPassed / totalDays) * 100;
  const weekNumber = getWeek(today, { weekStartsOn: 0 });
  
  // Generate week blocks (52 weeks)
  const weeks = Array.from({ length: 52 }, (_, i) => ({
    week: i + 1,
    isPast: i + 1 < weekNumber,
    isCurrent: i + 1 === weekNumber,
  }));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="col-span-full relative overflow-hidden liquid-glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="font-bold text-base">{today.getFullYear()} Progress</span>
            <p className="text-[10px] text-muted-foreground">Week {weekNumber} of 52</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-emerald-500">{Math.round(progress)}%</span>
      </div>
      
      {/* Weeks grid - horizontal layout */}
      <div className="mb-3" role="img" aria-label={`Year progress visualization showing ${weekNumber} of 52 weeks completed`}>
        <div className="flex flex-wrap gap-[3px]" aria-hidden="true">
          {weeks.map((week) => (
            <motion.div
              key={week.week}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: week.week * 0.008 }}
              className={`
                w-[10px] h-[10px] rounded-[2px] transition-all
                ${week.isPast || week.isCurrent 
                  ? 'bg-emerald-500/60' 
                  : 'bg-muted/30'
                }
                ${week.isCurrent ? 'ring-1 ring-emerald-500' : ''}
              `}
              title={`Week ${week.week}${week.isCurrent ? ' (current)' : ''}`}
            />
          ))}
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <span className="text-muted-foreground">Remaining</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-500">
          <Award className="w-3 h-3" />
          <span>{52 - weekNumber} weeks to go</span>
        </div>
      </div>
    </motion.div>
  );
}
