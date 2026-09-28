import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, Check } from 'lucide-react';
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
  poll: Poll;
  onViewResults: () => void;
  onBack: () => void;
}

export default function VotingView({ poll, onViewResults, onBack }: Props) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Check if already voted
    supabase.from('poll_votes').select('option_index').eq('poll_id', poll.id).eq('voter_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setUserVote((data as any).option_index);
      });
    // Get total votes
    supabase.from('poll_votes').select('id', { count: 'exact', head: true }).eq('poll_id', poll.id)
      .then(({ count }) => setTotalVotes(count || 0));
  }, [poll.id, user]);

  const submitVote = async () => {
    if (!user || selectedOption === null) return;
    setLoading(true);
    const { error } = await supabase.from('poll_votes').insert({
      poll_id: poll.id,
      voter_id: user.id,
      option_index: selectedOption,
    });
    setLoading(false);
    if (error) {
      toast.error('Already voted or error');
      return;
    }
    setUserVote(selectedOption);
    setTotalVotes(t => t + 1);
    toast.success('Vote recorded!');
  };

  const hasVoted = userVote !== null;

  return (
    <div className="flex flex-col gap-4 py-3">
      <Button variant="ghost" size="sm" className="self-start gap-1" onClick={onBack}>
        <ChevronLeft className="w-4 h-4" /> Back
      </Button>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground text-base mb-1">{poll.question}</h3>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2">
            {poll.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isVoted = userVote === idx;
              return (
                <motion.button
                  key={idx}
                  onClick={() => !hasVoted && setSelectedOption(idx)}
                  disabled={hasVoted}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    isVoted
                      ? 'border-primary bg-primary/10'
                      : isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border/50 hover:bg-accent'
                  }`}
                  whileTap={!hasVoted ? { scale: 0.98 } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected || isVoted ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}>
                      {(isSelected || isVoted) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!hasVoted ? (
        <Button
          onClick={submitVote}
          disabled={loading || selectedOption === null}
          className="w-full h-11 font-semibold"
        >
          {loading ? 'Submitting...' : 'Submit Vote'}
        </Button>
      ) : (
        <Button onClick={onViewResults} className="w-full h-11 font-semibold gap-2">
          View Results
        </Button>
      )}
    </div>
  );
}
