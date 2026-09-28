import { CalendarCheck, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay } from '@/hooks/useCurrentTimeUpdate';
import { Button } from '@/components/ui/button';

export function TomorrowScheduleTile() {
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  
  // Use reactive time state - updates every minute
  const { dayOfWeek } = useCurrentTimeUpdate();
  
  // Calculate tomorrow based on reactive dayOfWeek
  const tomorrowDay = (dayOfWeek + 1) % 7;
  
  // Get tomorrow's classes sorted by time
  const tomorrowClasses = (classes ?? [])
    .filter((c) => c.day === tomorrowDay)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  
  // Show max 4 classes
  const displayClasses = tomorrowClasses.slice(0, 4);
  const remainingCount = tomorrowClasses.length - 4;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-background/40 border border-border/50 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-semibold text-sm">Daily schedule</span>
        </div>
      </div>
      
      {/* Content - Pixel consistent layout */}
      {displayClasses.length > 0 ? (
        <div className="space-y-1">
          {displayClasses.map((classItem, index) => {
            const subject = subjects?.find(s => s.id === classItem.subject_id);
            
            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="flex items-center gap-3 h-8"
              >
                {/* Fixed-width time column - right aligned */}
                <span className="w-[70px] flex-shrink-0 text-xs text-muted-foreground font-medium tabular-nums text-right">
                  {formatTimeDisplay(classItem.start_time)}
                </span>
                
                {/* Color dot - fixed 8px */}
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject?.color || '#666' }}
                />
                
                {/* Subject name - truncate with ellipsis */}
                <span className="flex-1 text-sm font-medium truncate min-w-0">
                  {subject?.name || 'Unknown'}
                </span>
              </motion.div>
            );
          })}
          
          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              +{remainingCount} more classes
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No classes tomorrow</p>
        </div>
      )}
      
      {/* Add button */}
      <Link to="/timetable/add" className="block mt-4">
        <Button 
          variant="outline" 
          className="w-full h-9 rounded-xl gap-2 text-xs border-dashed"
        >
          <Plus className="w-4 h-4" />
          New class
        </Button>
      </Link>
    </motion.div>
  );
}
