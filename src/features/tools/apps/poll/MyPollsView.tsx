import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Copy, Trash2, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';
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
  refreshKey: number;
  onViewResults: (poll: Poll) => void;
  onVote: (poll: Poll) => void;
  onShare: (poll: Poll) => void;
}

export default function MyPollsView({ refreshKey, onViewResults, onVote, onShare }: Props) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from('polls').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const parsed = data.map(d => ({ ...d, options: d.options as any })) as Poll[];
          setPolls(parsed);
          // Fetch vote counts
          Promise.all(parsed.map(p =>
            supabase.from('poll_votes').select('id', { count: 'exact', head: true }).eq('poll_id', p.id)
              .then(r => ({ id: p.id, count: r.count || 0 }))
          )).then(counts => {
            const map: Record<string, number> = {};
            counts.forEach(c => { map[c.id] = c.count; });
            setVoteCounts(map);
          });
        }
      });
  }, [user, refreshKey]);

  const totalPolls = polls.length;
  const totalVotes = Object.values(voteCounts).reduce((s, c) => s + c, 0);

  const copyShareLink = (code: string | null) => {
    if (!code) return;
    navigator.clipboard.writeText(`${window.location.origin}/tools?poll=${code}`);
    toast.success('Share link copied!');
  };

  const deletePoll = async (id: string) => {
    await supabase.from('poll_votes').delete().eq('poll_id', id);
    await supabase.from('polls').delete().eq('id', id);
    setPolls(polls.filter(p => p.id !== id));
    toast.success('Poll deleted');
  };

  return (
    <div className="flex flex-col gap-4 py-3">
      {/* Hero Stats */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-xs font-medium opacity-80 mb-1">My Polls</p>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-bold">{totalPolls}</p>
              <p className="text-[10px] opacity-70">Total Polls</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{totalVotes}</p>
              <p className="text-[10px] opacity-70">Total Votes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Poll List */}
      {polls.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No polls yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {polls.map((poll, i) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onVote(poll)}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{poll.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {poll.options.length} options
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {voteCounts[poll.id] || 0} votes
                        </span>
                        {poll.share_code && (
                          <span className="text-[10px] text-muted-foreground">
                            · {poll.share_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onViewResults(poll); }}>
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); copyShareLink(poll.share_code); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deletePoll(poll.id); }}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
