import { useCGPAStore } from './useCGPAStore';
import { calculateSemesterGPA, calculateCumulativeGPA, getGradeDistribution, getTotalCredits, getGradeColor } from './utils';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsView() {
  const { semesters, settings } = useCGPAStore();
  const cgpa = calculateCumulativeGPA(semesters, settings.scale, settings.roundingDecimals);
  const totalCredits = getTotalCredits(semesters);
  const totalCourses = semesters.flatMap(s => s.courses).filter(c => c.includeInCGPA).length;

  const trendData = semesters.map((sem, i) => ({
    name: `S${i + 1}`,
    gpa: calculateSemesterGPA(sem.courses, settings.scale, settings.roundingDecimals),
    cgpa: calculateCumulativeGPA(semesters.slice(0, i + 1), settings.scale, settings.roundingDecimals),
  }));

  const gradeDistribution = getGradeDistribution(semesters);
  const pieData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade, value: count, color: getGradeColor(grade),
  }));

  const highest = trendData.length > 0 ? Math.max(...trendData.map(d => d.gpa)) : 0;
  const lowest = trendData.length > 0 ? Math.min(...trendData.map(d => d.gpa)) : 0;

  if (semesters.length === 0) {
    return (
      <div className="pb-20 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Analytics</h2>
        </div>
        <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">Add semesters and courses to see analytics.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Analytics</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'CGPA', value: cgpa.toFixed(settings.roundingDecimals) },
          { label: 'Credits', value: totalCredits },
          { label: 'Highest Sem', value: highest.toFixed(settings.roundingDecimals) },
          { label: 'Lowest Sem', value: lowest.toFixed(settings.roundingDecimals) },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GPA Growth */}
      {trendData.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">GPA Growth</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, settings.scale]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                <Line type="monotone" dataKey="gpa" stroke="hsl(200, 70%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="Sem GPA" />
                <Line type="monotone" dataKey="cgpa" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="CGPA" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Grade Spread */}
      {pieData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <PieIcon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Grade Distribution</h3>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-foreground font-medium">{d.name}</span>
                    </div>
                    <span className="text-muted-foreground">{d.value} ({totalCourses > 0 ? Math.round(d.value / totalCourses * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
