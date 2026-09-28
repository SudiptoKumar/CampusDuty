import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square, DollarSign, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MeetingCostCalc() {
  const [attendees, setAttendees] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const totalCost = (elapsed / 3600) * attendees * hourlyRate;
  const costPerMinute = (attendees * hourlyRate) / 60;
  const costPerPerson = elapsed > 0 ? totalCost / attendees : 0;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const reset = () => { setRunning(false); setElapsed(0); };

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Setup */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Attendees</Label>
              <Input type="number" min={1} value={attendees} onChange={e => setAttendees(Number(e.target.value) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> Hourly Rate</Label>
              <Input type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer display */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-2">
            <Clock className="w-3.5 h-3.5" /> Elapsed Time
          </div>
          <p className="text-4xl font-mono font-bold text-foreground">{formatTime(elapsed)}</p>
          <motion.div
            className="flex items-center justify-center gap-1 mt-3"
            animate={running ? { scale: [1, 1.03, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {running && <DollarSign className="w-5 h-5 text-primary" />}
            <span className="text-3xl font-bold text-primary">${totalCost.toFixed(2)}</span>
          </motion.div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {attendees} people × ${hourlyRate}/hr
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-2">
        {!running ? (
          <Button onClick={() => setRunning(true)} className="flex-1 gap-2">
            <Play className="w-4 h-4" /> Start
          </Button>
        ) : (
          <Button onClick={() => setRunning(false)} variant="outline" className="flex-1 gap-2">
            <Square className="w-4 h-4" /> Stop
          </Button>
        )}
        <Button variant="outline" onClick={reset} disabled={elapsed === 0}>Reset</Button>
      </div>

      {/* Summary */}
      {elapsed > 0 && !running && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-3">Meeting Summary</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-sm font-bold text-foreground">{formatTime(elapsed)}</p>
                <p className="text-[10px] text-muted-foreground">Duration</p>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">${totalCost.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Total Cost</p>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">${costPerPerson.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Per Person</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">Rate: ${costPerMinute.toFixed(2)}/min</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
