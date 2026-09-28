import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface Poll {
  id: string;
  question: string;
  options: { label: string }[];
  share_code: string | null;
  created_at: string;
  user_id: string;
}

interface Props {
  poll: Poll;
  onBack: () => void;
}

export default function ResultsView({ poll, onBack }: Props) {
  const [votes, setVotes] = useState<Record<number, number>>({});

  useEffect(() => {
    supabase.from('poll_votes').select('option_index').eq('poll_id', poll.id)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<number, number> = {};
        data.forEach((v: any) => { counts[v.option_index] = (counts[v.option_index] || 0) + 1; });
        setVotes(counts);
      });
  }, [poll.id]);

  const totalVotes = Object.values(votes).reduce((s, c) => s + c, 0);
  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <div className="flex flex-col gap-4 py-3">
      <Button variant="ghost" size="sm" className="self-start gap-1" onClick={onBack}>
        <ChevronLeft className="w-4 h-4" /> Back
      </Button>

      <h3 className="font-semibold text-foreground text-base">{poll.question}</h3>

      {/* Stats Pills */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl bg-primary/10 p-3 text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalVotes}</p>
          <p className="text-[10px] text-muted-foreground">Total Votes</p>
        </div>
        <div className="flex-1 rounded-xl bg-primary/10 p-3 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{poll.options.length}</p>
          <p className="text-[10px] text-muted-foreground">Options</p>
        </div>
      </div>

      {/* Result Bars */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {poll.options.map((opt, idx) => {
            const count = votes[idx] || 0;
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const isWinning = count === maxVotes && count > 0;
            return (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isWinning ? 'bg-gradient-to-r from-primary to-primary/70' : 'bg-primary/40'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
