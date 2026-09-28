import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useGrades, calculateWeightedAverage } from '@/hooks/useGrades';
import { useAttendance, calculateAttendanceStats } from '@/hooks/useAttendance';

export function SubjectProgressWidget() {
  const { data: subjects } = useSubjects();
  const { data: grades } = useGrades();
  const { data: attendance } = useAttendance();
  
  const subjectsWithProgress = subjects?.map((subject) => {
    const subjectGrades = (grades ?? []).filter((g) => g.subject_id === subject.id);
    const subjectAttendance = (attendance ?? []).filter((a) => a.subject_id === subject.id);
    
    const gradeAvg = calculateWeightedAverage(subjectGrades);
    const attendanceStats = calculateAttendanceStats(subjectAttendance);
    
    // Calculate overall "health" score (weighted: 70% grades, 30% attendance)
    const gradeScore = gradeAvg !== null ? gradeAvg : 0;
    const attendScore = attendanceStats.total > 0 ? attendanceStats.rate : 0;
    const healthScore = gradeAvg !== null && attendanceStats.total > 0
      ? (gradeScore * 0.7 + attendScore * 0.3)
      : gradeAvg !== null
        ? gradeScore
        : attendanceStats.total > 0
          ? attendScore
          : null;
    
    return {
      subject,
      gradeAvg,
      attendanceRate: attendanceStats.total > 0 ? attendanceStats.rate : null,
      healthScore,
      hasData: gradeAvg !== null || attendanceStats.total > 0,
    };
  }).filter((s) => s.hasData).slice(0, 4);
  
  const getHealthColor = (score: number | null) => {
    if (score === null) return 'bg-muted';
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!subjectsWithProgress || subjectsWithProgress.length === 0) {
    return null;
  }

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Subject Progress</h2>
        </div>
        <Link to="/subjects" className="text-xs text-primary flex items-center hover:underline">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {subjectsWithProgress.map(({ subject, gradeAvg, attendanceRate, healthScore }) => (
          <div key={subject.id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-sm font-medium flex-1 truncate">{subject.name}</span>
              <div className="flex items-center gap-2 text-xs">
                {gradeAvg !== null && (
                  <span className="text-muted-foreground">
                    {gradeAvg.toFixed(0)}%
                  </span>
                )}
                {attendanceRate !== null && (
                  <span className="text-muted-foreground opacity-60">
                    ({Math.round(attendanceRate)}% att)
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getHealthColor(healthScore)}`}
                style={{ width: `${healthScore ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
