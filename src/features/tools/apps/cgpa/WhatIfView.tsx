import { useState } from 'react';
import { useCGPAStore } from './useCGPAStore';
import { calculateCumulativeGPA, getTotalCredits, gradeToPoints, ALL_GRADES } from './utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatIfView() {
  const { semesters, settings } = useCGPAStore();
  const currentCGPA = calculateCumulativeGPA(semesters, settings.scale, settings.roundingDecimals);
  const currentCredits = getTotalCredits(semesters);

  const [targetCGPA, setTargetCGPA] = useState(settings.scale === 4.0 ? '3.5' : settings.scale === 5.0 ? '4.0' : '8.0');
  const [upcomingCredits, setUpcomingCredits] = useState('15');

  const target = parseFloat(targetCGPA) || 0;
  const upcoming = parseInt(upcomingCredits) || 0;

  // Required GPA for upcoming semester to hit target
  const totalNeededPoints = target * (currentCredits + upcoming);
  const currentPoints = currentCGPA * currentCredits;
  const requiredGPA = upcoming > 0 ? Math.max(0, (totalNeededPoints - currentPoints) / upcoming) : 0;
  const feasible = requiredGPA <= settings.scale;

  // Predicted CGPA if user gets a certain grade in all upcoming courses
  const [selectedGrade, setSelectedGrade] = useState('A');
  const gradePoints = gradeToPoints(selectedGrade, settings.scale);
  const predictedCGPA = upcoming > 0
    ? (currentPoints + gradePoints * upcoming) / (currentCredits + upcoming)
    : currentCGPA;

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">What-If Calculator</h2>
      </div>

      {/* Current status */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <CardContent className="p-5 relative z-10">
          <p className="text-sm text-white/80">Current CGPA</p>
          <p className="text-4xl font-extrabold">{currentCGPA.toFixed(settings.roundingDecimals)}</p>
          <p className="text-xs text-white/70 mt-1">{currentCredits} total credits</p>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Target CGPA</Label>
              <div className="relative">
                <Target className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="number" step="0.1" min={0} max={settings.scale} value={targetCGPA} onChange={e => setTargetCGPA(e.target.value)} className="h-9 text-sm pl-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Upcoming Credits</Label>
              <Input type="number" min={1} max={50} value={upcomingCredits} onChange={e => setUpcomingCredits(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required GPA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={feasible ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' : 'border-destructive/30 bg-red-50/50 dark:bg-red-950/20'}>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Required GPA next semester</p>
            <p className={`text-3xl font-extrabold mt-1 ${feasible ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {requiredGPA > settings.scale ? `>${settings.scale.toFixed(1)}` : requiredGPA.toFixed(settings.roundingDecimals)}
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              {feasible ? 'Achievable! Keep it up.' : 'Not achievable in one semester.'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grade predictor */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">If you get all...</h3>
          <div className="flex flex-wrap gap-1.5">
            {ALL_GRADES.filter(g => g !== 'C-' && g !== 'D+').map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGrade === g
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">Predicted CGPA</p>
            <p className="text-2xl font-bold text-primary">{predictedCGPA.toFixed(settings.roundingDecimals)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
