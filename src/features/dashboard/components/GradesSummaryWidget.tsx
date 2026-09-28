import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGrades, calculateWeightedAverage } from '@/hooks/useGrades';
import { useSubjects } from '@/hooks/useSubjects';
import { AnimatedProgressRing } from '@/components/shared';

export function GradesSummaryWidget() {
  const { data: grades } = useGrades();
  const { data: subjects } = useSubjects();
  
  const overallAverage = calculateWeightedAverage(grades ?? []);
  
  // Calculate per-subject averages
  const subjectAverages = subjects?.map((subject) => {
    const subjectGrades = (grades ?? []).filter((g) => g.subject_id === subject.id);
    const average = calculateWeightedAverage(subjectGrades);
    return {
      subject,
      average,
      count: subjectGrades.length,
    };
  }).filter((s) => s.average !== null).slice(0, 4);
  
  const getGradeColor = (avg: number) => {
    if (avg >= 90) return 'hsl(var(--chart-2))'; // green
    if (avg >= 80) return 'hsl(var(--primary))';
    if (avg >= 70) return 'hsl(var(--chart-4))'; // yellow
    if (avg >= 60) return 'hsl(var(--chart-5))'; // orange
    return 'hsl(var(--destructive))';
  };
  
  const getGradeTrend = (avg: number) => {
    if (avg >= 85) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (avg >= 70) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };
  
  return (
    <section className="surface-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Grades Overview</h2>
        <Link 
          to="/grades" 
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          All Grades <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {overallAverage !== null ? (
        <div className="space-y-4">
          {/* Overall Average with Animated Ring */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
            <AnimatedProgressRing
              value={overallAverage}
              size={72}
              strokeWidth={6}
              color={getGradeColor(overallAverage)}
              label="avg"
            />
            <div className="flex-1">
              <p className="font-medium">Overall Average</p>
              <p className="text-sm text-muted-foreground">
                {grades?.length} grade{(grades?.length ?? 0) !== 1 ? 's' : ''} recorded
              </p>
            </div>
            {getGradeTrend(overallAverage)}
          </div>
          
          {/* Per-Subject Averages with mini rings */}
          {subjectAverages && subjectAverages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {subjectAverages.map(({ subject, average, count }) => (
                <div 
                  key={subject.id}
                  className="p-3 rounded-lg border border-border flex items-center gap-3"
                >
                  <AnimatedProgressRing
                    value={average!}
                    size={44}
                    strokeWidth={4}
                    color={subject.color}
                    showValue={false}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </AnimatedProgressRing>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground truncate block">
                      {subject.name}
                    </span>
                    <span className="text-sm font-bold" style={{ color: getGradeColor(average!) }}>
                      {average!.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No grades recorded yet</p>
        </div>
      )}
    </section>
  );
}
