import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isBefore } from 'date-fns';
import { useSubjects } from '@/hooks/useSubjects';
import { useGrades, calculateGPA, calculateSubjectGPAs, percentageToGPA, calculateWeightedAverage } from '@/hooks/useGrades';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { AnimatedProgressRing } from '@/components/shared/AnimatedProgressRing';
import { 
  Calculator, Clock, Target, AlertTriangle, CheckCircle2, 
  GraduationCap, Flame, ArrowRight, ChevronDown, ChevronUp,
  Plus, X, TrendingUp, TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamCountdown {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
}

function useExamCountdown(examDate: Date | null): ExamCountdown {
  const [, setTick] = useState(0);
  
  useState(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  });
  
  if (!examDate) {
    return { days: 0, hours: 0, minutes: 0, isPast: true };
  }
  
  const now = new Date();
  const isPast = isBefore(examDate, now);
  
  if (isPast) {
    return { days: 0, hours: 0, minutes: 0, isPast: true };
  }
  
  const days = differenceInDays(examDate, now);
  const hours = differenceInHours(examDate, now) % 24;
  const minutes = differenceInMinutes(examDate, now) % 60;
  
  return { days, hours, minutes, isPast: false };
}

interface HypotheticalGrade {
  id: string;
  subjectId: string;
  score: number;
  maxScore: number;
  weight: number;
}

export function ExamModePage() {
  const { data: subjects } = useSubjects();
  const { data: grades } = useGrades();
  const { data: tasks } = useTasks();
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [targetGrade, setTargetGrade] = useState<number>(60);
  const [examWeight, setExamWeight] = useState<number>(40);
  const [showCalculator, setShowCalculator] = useState(true);
  const [showGPA, setShowGPA] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  
  // What-if simulator state
  const [hypotheticals, setHypotheticals] = useState<HypotheticalGrade[]>([]);
  const [targetGPA, setTargetGPA] = useState<number>(3.0);
  
  // Find upcoming exams from tasks
  const upcomingExams = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter(t => t.type === 'exam' && !t.is_completed)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);
  }, [tasks]);
  
  const nextExam = upcomingExams[0];
  const nextExamDate = nextExam ? new Date(nextExam.due_date) : null;
  const countdown = useExamCountdown(nextExamDate);
  
  // GPA calculations
  const currentGPA = useMemo(() => calculateGPA(grades ?? []), [grades]);
  const subjectGPAs = useMemo(
    () => calculateSubjectGPAs(grades ?? [], subjects ?? []),
    [grades, subjects]
  );
  
  // Projected GPA with hypothetical grades
  const projectedGPA = useMemo(() => {
    if (!grades || hypotheticals.length === 0) return currentGPA;
    const hypoGrades = hypotheticals.map(h => ({
      id: h.id,
      value: h.score,
      max_score: h.maxScore,
      weight: h.weight,
      subject_id: h.subjectId,
      term_id: '',
      type: 'written' as const,
      date: new Date().toISOString(),
      created_at: '',
      updated_at: '',
      user_id: '',
      notes: null,
    }));
    const allGrades = [...grades, ...hypoGrades];
    return calculateGPA(allGrades);
  }, [grades, hypotheticals, currentGPA]);
  
  const gpaChange = projectedGPA !== null && currentGPA !== null
    ? projectedGPA - currentGPA
    : null;
  
  // Calculate current average for selected subject
  const currentAverage = useMemo(() => {
    if (!selectedSubject || !grades) return null;
    const subjectGrades = grades.filter(g => g.subject_id === selectedSubject);
    if (subjectGrades.length === 0) return null;
    return calculateWeightedAverage(subjectGrades);
  }, [selectedSubject, grades]);
  
  // Calculate minimum exam score needed
  const minimumExamScore = useMemo(() => {
    if (currentAverage === null) return targetGrade;
    const priorWeight = 100 - examWeight;
    const priorContribution = (currentAverage * priorWeight) / 100;
    const neededFromExam = targetGrade - priorContribution;
    const requiredScore = (neededFromExam * 100) / examWeight;
    return Math.max(0, Math.min(100, requiredScore));
  }, [currentAverage, targetGrade, examWeight]);
  
  const isAchievable = minimumExamScore <= 100;
  const isEasy = minimumExamScore < 50;
  const isModerate = minimumExamScore >= 50 && minimumExamScore < 80;
  const isHard = minimumExamScore >= 80 && minimumExamScore <= 100;

  const addHypothetical = () => {
    setHypotheticals(prev => [...prev, {
      id: crypto.randomUUID(),
      subjectId: subjects?.[0]?.id || '',
      score: 75,
      maxScore: 100,
      weight: 1,
    }]);
  };
  
  const removeHypothetical = (id: string) => {
    setHypotheticals(prev => prev.filter(h => h.id !== id));
  };
  
  const updateHypothetical = (id: string, field: keyof HypotheticalGrade, value: string | number) => {
    setHypotheticals(prev => prev.map(h =>
      h.id === id ? { ...h, [field]: value } : h
    ));
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 max-w-2xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Exam Mode</h1>
        </div>
        <p className="text-muted-foreground text-sm">Focus on what matters. Calculate your path to success.</p>
      </header>
      
      {/* Countdown Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-6">
            {nextExam ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Exam</p>
                    <h3 className="text-lg font-semibold">{nextExam.title}</h3>
                    {nextExam.subject_id && subjects && (
                      <p className="text-sm text-muted-foreground">
                        {subjects.find(s => s.id === nextExam.subject_id)?.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{format(nextExamDate!, 'MMM d, yyyy')}</p>
                    {nextExam.due_time && <p className="text-xs text-muted-foreground">{nextExam.due_time}</p>}
                  </div>
                </div>
                {!countdown.isPast ? (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <CountdownUnit value={countdown.days} label="Days" />
                    <CountdownUnit value={countdown.hours} label="Hours" />
                    <CountdownUnit value={countdown.minutes} label="Minutes" />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Exam time has passed</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No upcoming exams</p>
                <p className="text-xs text-muted-foreground mt-1">Add exams in your Agenda to see countdowns here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Upcoming Exams List */}
      {upcomingExams.length > 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">All Upcoming Exams</h3>
          <div className="space-y-2">
            {upcomingExams.slice(1).map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subjects?.find(s => s.id === exam.subject_id)?.color || 'hsl(var(--muted-foreground))' }} />
                  <div>
                    <p className="text-sm font-medium">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{subjects?.find(s => s.id === exam.subject_id)?.name}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(exam.due_date), 'MMM d')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* GPA Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowGPA(!showGPA)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">GPA Overview</CardTitle>
              </div>
              {showGPA ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
            <CardDescription>Your current cumulative GPA on a 4.0 scale</CardDescription>
          </CardHeader>
          <AnimatePresence>
            {showGPA && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <CardContent className="space-y-4">
                  {currentGPA !== null ? (
                    <>
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
                            <circle cx="48" cy="48" r="42" stroke="hsl(var(--primary))" strokeWidth="6" fill="none" strokeDasharray={`${(currentGPA / 4.0) * 264} 264`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold">{currentGPA.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">/ 4.0</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Per Subject</p>
                          <div className="space-y-1.5">
                            {subjectGPAs.slice(0, 5).map((sg) => (
                              <div key={sg.subjectId} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sg.color }} />
                                  <span className="text-xs truncate">{sg.name}</span>
                                </div>
                                <span className="text-xs font-semibold shrink-0">{sg.gpa.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Add grades to see your GPA</p>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      {/* What-If Simulator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowSimulator(!showSimulator)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">What-If Simulator</CardTitle>
              </div>
              {showSimulator ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
            <CardDescription>Add hypothetical grades to see how your GPA would change</CardDescription>
          </CardHeader>
          <AnimatePresence>
            {showSimulator && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <CardContent className="space-y-4">
                  {hypotheticals.map((h) => (
                    <div key={h.id} className="flex items-end gap-2 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Select value={h.subjectId} onValueChange={(v) => updateHypothetical(h.id, 'subjectId', v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects?.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                  {s.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input type="number" value={h.score} onChange={(e) => updateHypothetical(h.id, 'score', Number(e.target.value))} className="h-8 text-xs" placeholder="Score" min={0} max={h.maxScore} />
                          <span className="text-xs self-center text-muted-foreground">/</span>
                          <Input type="number" value={h.maxScore} onChange={(e) => updateHypothetical(h.id, 'maxScore', Number(e.target.value))} className="h-8 text-xs w-16" placeholder="Max" min={1} />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeHypothetical(h.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button variant="outline" size="sm" onClick={addHypothetical} className="w-full gap-1.5">
                    <Plus className="w-4 h-4" /> Add Hypothetical Grade
                  </Button>
                  
                  {hypotheticals.length > 0 && projectedGPA !== null && (
                    <motion.div
                      key={projectedGPA}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "p-4 rounded-xl text-center",
                        gpaChange !== null && gpaChange > 0
                          ? "bg-green-500/10 border border-green-500/30"
                          : gpaChange !== null && gpaChange < 0
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-muted/30 border border-border"
                      )}
                    >
                      <p className="text-sm text-muted-foreground mb-1">Projected GPA</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold">{projectedGPA.toFixed(2)}</span>
                        {gpaChange !== null && gpaChange !== 0 && (
                          <span className={cn(
                            "flex items-center gap-0.5 text-sm font-medium",
                            gpaChange > 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {gpaChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {gpaChange > 0 ? '+' : ''}{gpaChange.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      {/* Pass Calculator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowCalculator(!showCalculator)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Pass Calculator</CardTitle>
              </div>
              {showCalculator ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
            <CardDescription>Calculate the minimum score you need on your exam</CardDescription>
          </CardHeader>
          <AnimatePresence>
            {showCalculator && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                              {subject.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedSubject && (
                    <div className="p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Average</span>
                        <span className="text-lg font-bold">{currentAverage !== null ? `${Math.round(currentAverage)}%` : 'No grades yet'}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Target Final Grade</Label>
                      <span className="text-lg font-bold text-primary">{targetGrade}%</span>
                    </div>
                    <Slider value={[targetGrade]} onValueChange={(v) => setTargetGrade(v[0])} min={0} max={100} step={5} className="py-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Exam Weight</Label>
                      <span className="text-lg font-bold">{examWeight}%</span>
                    </div>
                    <Slider value={[examWeight]} onValueChange={(v) => setExamWeight(v[0])} min={10} max={100} step={5} className="py-2" />
                    <p className="text-xs text-muted-foreground">How much of your final grade does this exam count for?</p>
                  </div>
                  
                  <motion.div
                    key={minimumExamScore}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "p-6 rounded-2xl text-center",
                      isAchievable 
                        ? isEasy ? "bg-green-500/10 border border-green-500/30"
                        : isModerate ? "bg-yellow-500/10 border border-yellow-500/30"
                        : "bg-orange-500/10 border border-orange-500/30"
                        : "bg-destructive/10 border border-destructive/30"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isAchievable ? (isEasy ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Target className="w-5 h-5 text-yellow-500" />) : <AlertTriangle className="w-5 h-5 text-destructive" />}
                      <span className="text-sm font-medium text-muted-foreground">{isAchievable ? 'Minimum Exam Score Needed' : 'Target Not Achievable'}</span>
                    </div>
                    <p className={cn("text-4xl font-bold", isAchievable ? isEasy ? "text-green-500" : isModerate ? "text-yellow-500" : "text-orange-500" : "text-destructive")}>
                      {isAchievable ? `${Math.round(minimumExamScore)}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isAchievable 
                        ? isEasy ? "You're in great shape! Keep up the good work."
                        : isModerate ? "Achievable with focused studying."
                        : "It's challenging but possible. Study hard!"
                        : `Even a perfect score won't reach ${targetGrade}%. Consider adjusting your target.`
                      }
                    </p>
                  </motion.div>
                  
                  {selectedSubject && isAchievable && (
                    <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Quick Tips
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {isHard && (
                          <li className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-1 shrink-0" />
                            <span>Focus on high-yield topics first</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 mt-1 shrink-0" />
                          <span>Practice with past papers if available</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 mt-1 shrink-0" />
                          <span>Take breaks to improve retention</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <motion.div key={value} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-bold text-orange-500">
        {value}
      </motion.div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default ExamModePage;
