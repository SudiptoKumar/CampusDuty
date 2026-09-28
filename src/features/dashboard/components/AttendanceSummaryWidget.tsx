import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAttendance, calculateAttendanceStats } from '@/hooks/useAttendance';
import { useSubjects } from '@/hooks/useSubjects';
import { AnimatedProgressRing } from '@/components/shared';

export function AttendanceSummaryWidget() {
  const { data: attendance } = useAttendance();
  const { data: subjects } = useSubjects();
  
  const stats = calculateAttendanceStats(attendance ?? []);
  
  // Calculate per-subject stats
  const subjectStats = subjects?.map((subject) => {
    const subjectRecords = (attendance ?? []).filter((a) => a.subject_id === subject.id);
    const subjectStat = calculateAttendanceStats(subjectRecords);
    return {
      subject,
      ...subjectStat,
    };
  }).filter((s) => s.total > 0).slice(0, 3);
  
  return (
    <section className="surface-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Attendance Summary</h2>
        <Link 
          to="/attendance" 
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          Details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {stats.total > 0 ? (
        <div className="space-y-4">
          {/* Overall Rate with Animated Ring */}
          <div className="flex items-center gap-4">
            <AnimatedProgressRing
              value={stats.rate}
              size={72}
              strokeWidth={6}
              label="rate"
              color="hsl(var(--primary))"
            />
            <div className="flex-1">
              <p className="font-medium">Overall Rate</p>
              <p className="text-sm text-muted-foreground">
                {stats.present} present, {stats.absent} absent, {stats.excused} excused
              </p>
            </div>
          </div>
          
          {/* Per-Subject Breakdown */}
          {subjectStats && subjectStats.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              {subjectStats.map(({ subject, rate, total }) => (
                <div key={subject.id} className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm flex-1 truncate">{subject.name}</span>
                  <span className="text-sm font-medium">{Math.round(rate)}%</span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${rate}%`,
                        backgroundColor: subject.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No attendance records yet</p>
        </div>
      )}
    </section>
  );
}
