import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward, Brain, Coffee, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePomodoroStore } from './usePomodoroStore';
import type { TimerPhase } from './types';
import { format } from 'date-fns';
import SettingsSheet from './SettingsSheet';

const PHASE_CONFIG: Record<TimerPhase, { label: string; color: string; icon: typeof Brain }> = {
  focus: { label: 'Deep Focus', color: 'hsl(var(--primary))', icon: Brain },
  shortBreak: { label: 'Short Break', color: 'hsl(142, 71%, 45%)', icon: Coffee },
  longBreak: { label: 'Long Break', color: 'hsl(262, 83%, 58%)', icon: Coffee },
};

export default function TimerView() {
  const { settings, tasks, activeTaskId, addSession, incrementTaskPomodoro, sessions } = usePomodoroStore();
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const durations: Record<TimerPhase, number> = {
    focus: settings.focusDuration * 60,
    shortBreak: settings.shortBreakDuration * 60,
    longBreak: settings.longBreakDuration * 60,
  };

  const totalTime = durations[phase];
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const config = PHASE_CONFIG[phase];
  const activeTask = tasks.find(t => t.id === activeTaskId);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter(s => s.date.startsWith(todayStr) && s.type === 'focus').length;
  const todayFocusMin = Math.round(sessions.filter(s => s.date.startsWith(todayStr) && s.type === 'focus').reduce((a, s) => a + s.duration, 0) / 60);

  const handlePhaseEnd = useCallback(() => {
    setIsRunning(false);
    if (phase === 'focus') {
      const n = sessionCount + 1;
      setSessionCount(n);
      addSession({ date: new Date().toISOString(), duration: settings.focusDuration * 60, type: 'focus', taskId: activeTaskId });
      if (activeTaskId) incrementTaskPomodoro(activeTaskId);
      if (n % settings.longBreakInterval === 0) {
        setPhase('longBreak');
        setTimeLeft(durations.longBreak);
      } else {
        setPhase('shortBreak');
        setTimeLeft(durations.shortBreak);
      }
    } else {
      addSession({ date: new Date().toISOString(), duration: durations[phase], type: phase, taskId: null });
      setPhase('focus');
      setTimeLeft(durations.focus);
    }
  }, [phase, sessionCount, settings, activeTaskId, addSession, incrementTaskPomodoro, durations]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handlePhaseEnd(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handlePhaseEnd]);

  const switchPhase = (p: TimerPhase) => { setIsRunning(false); setPhase(p); setTimeLeft(durations[p]); };
  const reset = () => { setIsRunning(false); setPhase('focus'); setTimeLeft(durations.focus); setSessionCount(0); };
  const toggle = () => setIsRunning(!isRunning);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const StateIcon = config.icon;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-full flex justify-end">
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}><Settings className="w-4 h-4" /></Button>
      </div>

      {/* Phase badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: config.color }}>
        <StateIcon className="w-3.5 h-3.5" />
        {config.label}
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        {(['focus', 'shortBreak', 'longBreak'] as TimerPhase[]).map(p => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${phase === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {p === 'focus' ? 'Focus' : p === 'shortBreak' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative w-56 h-56">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <motion.circle cx="100" cy="100" r={radius} fill="none" stroke={config.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} animate={{ strokeDashoffset }} transition={{ duration: 0.5 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-foreground">{mm}:{ss}</span>
          {activeTask && <span className="text-[10px] text-muted-foreground mt-1 max-w-[120px] truncate">{activeTask.name}</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={reset} className="rounded-full h-10 w-10"><RotateCcw className="w-4 h-4" /></Button>
        <Button size="lg" onClick={toggle} className="rounded-full w-14 h-14 shadow-lg" style={{ backgroundColor: config.color }}>
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => handlePhaseEnd()} className="rounded-full h-10 w-10"><SkipForward className="w-4 h-4" /></Button>
      </div>

      {/* Daily progress */}
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Daily Progress</span>
            <span className="text-xs text-muted-foreground">{todaySessions}/{settings.dailyGoal}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: config.color }} animate={{ width: `${Math.min((todaySessions / settings.dailyGoal) * 100, 100)}%` }} />
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">{todayFocusMin}m</p>
              <p className="text-[9px] text-muted-foreground">Focused</p>
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">{sessionCount}</p>
              <p className="text-[9px] text-muted-foreground">Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
