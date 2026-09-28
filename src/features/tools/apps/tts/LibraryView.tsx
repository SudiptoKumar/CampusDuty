import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Library, Upload, Clock, FileText } from 'lucide-react';
import { useTTSStore } from './useTTSStore';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';

interface Props {
  onUpload: () => void;
  onOpen: () => void;
}

export default function LibraryView({ onUpload, onOpen }: Props) {
  const { history, documents, setActiveDoc } = useTTSStore();

  // Weekly stats
  const today = new Date();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData = days.map((day, i) => {
    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setDate(d.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().split('T')[0];
    const secs = history
      .filter(h => h.date === dateStr)
      .reduce((s, h) => s + h.durationSeconds, 0);
    return { day, minutes: Math.round(secs / 60) };
  });

  const totalMinutes = weekData.reduce((s, d) => s + d.minutes, 0);

  // Group history
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const grouped = {
    today: history.filter(h => h.date === todayStr),
    yesterday: history.filter(h => h.date === yesterdayStr),
    earlier: history.filter(h => h.date < yesterdayStr),
  };

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    return `${Math.round(secs / 60)}m`;
  };

  return (
    <div className="flex flex-col gap-4 py-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Library className="w-5 h-5 text-primary" /> Library
      </h2>

      {/* Weekly Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">This Week</span>
            <span className="text-sm font-bold text-foreground">{totalMinutes} min</span>
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* History */}
      {history.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No listening history yet</p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([key, items]) => {
            if (items.length === 0) return null;
            const label = key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : 'Earlier';
            return (
              <div key={key} className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">{label}</span>
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="cursor-pointer hover:shadow-sm" onClick={() => {
                      const doc = documents.find(d => d.name === item.documentName);
                      if (doc) { setActiveDoc(doc.id); onOpen(); }
                    }}>
                      <CardContent className="p-2.5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-foreground flex-1 truncate">{item.documentName}</span>
                        <Badge variant="outline" className="text-[9px] h-4">{formatDuration(item.durationSeconds)}</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* Upload FAB */}
      <Button onClick={onUpload} className="w-full gap-2 mt-2">
        <Upload className="w-4 h-4" /> Upload Document
      </Button>
    </div>
  );
}
