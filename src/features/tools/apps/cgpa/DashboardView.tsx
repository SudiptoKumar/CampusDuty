import { useCGPAStore } from './useCGPAStore';
import { calculateCumulativeGPA, calculateSemesterGPA, getTotalCredits } from './utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardViewProps {
  onOpenSettings: () => void;
}

export default function DashboardView({ onOpenSettings }: DashboardViewProps) {
  const { semesters, settings, addSemester, selectSemester } = useCGPAStore();
  const cgpa = calculateCumulativeGPA(semesters, settings.scale, settings.roundingDecimals);
  const totalCredits = getTotalCredits(semesters);
  const lastSemGPA = semesters.length > 0
    ? calculateSemesterGPA(semesters[semesters.length - 1].courses, settings.scale, settings.roundingDecimals)
    : 0;

  const trendData = semesters.map((sem, i) => ({
    name: `S${i + 1}`,
    gpa: calculateSemesterGPA(sem.courses, settings.scale, settings.roundingDecimals),
    cgpa: calculateCumulativeGPA(semesters.slice(0, i + 1), settings.scale, settings.roundingDecimals),
  }));

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">CGPA Calculator</h2>
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 border-0 text-white">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <CardContent className="p-6 relative z-10">
            <p className="text-sm text-white/80">Cumulative GPA</p>
            <p className="text-5xl font-extrabold mt-1">{cgpa.toFixed(settings.roundingDecimals)}</p>
            <p className="text-xs text-white/70 mt-1">Scale: {settings.scale.toFixed(1)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Credits', value: totalCredits },
          { label: 'Last Sem', value: lastSemGPA.toFixed(settings.roundingDecimals) },
          { label: 'Semesters', value: semesters.length },
        ].map(s => (
          <Card key={s.label} className="bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GPA Trend */}
      {trendData.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">GPA Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
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

      {/* Semester List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Semesters</h3>
          <Button size="sm" variant="outline" onClick={addSemester} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        {semesters.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No semesters yet. Add one to get started!</p>
              <Button size="sm" className="mt-3 gap-1" onClick={addSemester}>
                <Plus className="w-4 h-4" /> Add Semester
              </Button>
            </CardContent>
          </Card>
        )}

        {semesters.map((sem, i) => {
          const semGPA = calculateSemesterGPA(sem.courses, settings.scale, settings.roundingDecimals);
          const credits = sem.courses.filter(c => c.includeInCGPA).reduce((s, c) => s + c.creditHours, 0);
          return (
            <motion.div key={sem.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => selectSemester(sem.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sem.name}</p>
                    <p className="text-xs text-muted-foreground">{sem.courses.length} courses · {credits} credits</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{semGPA.toFixed(settings.roundingDecimals)}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
