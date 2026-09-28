import { Bell, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGrades } from '@/hooks/useGrades';
import { useSubjects } from '@/hooks/useSubjects';
import { format, isAfter, subDays } from 'date-fns';

export function InboxTile() {
  const { data: grades } = useGrades();
  const { data: subjects } = useSubjects();
  
  // Get grades from last 7 days
  const recentGrades = (grades ?? [])
    .filter(g => isAfter(new Date(g.date), subDays(new Date(), 7)))
    .slice(0, 3);
  
  const getSubject = (id: string) => subjects?.find(s => s.id === id);
  
  const hasUpdates = recentGrades.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-background/40 border border-white/10 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Inbox</span>
        </div>
        {hasUpdates && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            {recentGrades.length} new
          </span>
        )}
      </div>
      
      {/* Content */}
      {hasUpdates ? (
        <div className="space-y-2">
          {recentGrades.map((grade) => {
            const subject = getSubject(grade.subject_id);
            const percentage = (grade.value / grade.max_score) * 100;
            
            return (
              <div 
                key={grade.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: subject?.color || '#666' }}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{subject?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(grade.date), 'MMM d')}
                  </p>
                </div>
                <span className={`text-xs font-bold ${percentage >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No new updates</p>
        </div>
      )}
      
      {/* Footer link */}
      <Link 
        to="/grades" 
        className="flex items-center justify-center gap-1 mt-3 text-xs text-primary font-medium hover:gap-2 transition-all"
      >
        View all <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  );
}
