import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';

interface Poll {
  id: string;
  question: string;
  options: { label: string }[];
  share_code: string | null;
  created_at: string;
  user_id: string;
}

interface Props {
  onCreated: (poll: Poll) => void;
}

export default function CreatePollView({ onCreated }: Props) {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [anonymous, setAnonymous] = useState(false);
  const [multiSelect, setMultiSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const createPoll = async () => {
    if (!user || !question.trim() || options.filter(o => o.trim()).length < 2) {
      toast.error('Need a question and at least 2 options');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('polls').insert({
      user_id: user.id,
      question: question.trim(),
      options: options.filter(o => o.trim()).map(o => ({ label: o.trim() })),
    }).select().single();
    setLoading(false);

    if (error) { toast.error('Failed to create poll'); return; }

    const poll: Poll = {
      ...data,
      options: data.options as any,
    };
    setQuestion('');
    setOptions(['', '']);
    toast.success('Poll created!');
    onCreated(poll);
  };

  const validOptions = options.filter(o => o.trim()).length;

  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Create Poll</h2>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Your Question</label>
          <Input
            placeholder="What do you want to ask?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="text-base font-medium"
          />
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">{String.fromCharCode(65 + i)}</span>
              </div>
              <Input
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                className="text-sm flex-1"
              />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOption(i)}>
                  <Minus className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button variant="outline" size="sm" onClick={addOption} className="gap-1 w-full mt-1">
              <Plus className="w-3 h-3" /> Add Option
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <label className="text-xs font-medium text-muted-foreground block">Poll Settings</label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Anonymous Voting</span>
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Multiple Answers</span>
            <Switch checked={multiSelect} onCheckedChange={setMultiSelect} />
          </div>
        </CardContent>
      </Card>

      {/* Create Button */}
      <Button
        onClick={createPoll}
        disabled={loading || !question.trim() || validOptions < 2}
        className="w-full h-11 text-sm font-semibold"
      >
        {loading ? 'Creating...' : 'Create Poll'}
      </Button>
    </div>
  );
}
