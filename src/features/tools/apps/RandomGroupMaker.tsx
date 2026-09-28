import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shuffle, Plus, X, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitIntoGroups(names: string[], count: number): string[][] {
  const shuffled = shuffle(names);
  const groups: string[][] = Array.from({ length: count }, () => []);
  shuffled.forEach((name, i) => groups[i % count].push(name));
  return groups;
}

const GROUP_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 71%, 45%)',
  'hsl(262, 83%, 58%)',
  'hsl(25, 80%, 55%)',
  'hsl(200, 80%, 50%)',
  'hsl(340, 80%, 55%)',
  'hsl(45, 90%, 50%)',
  'hsl(170, 70%, 45%)',
];

export default function RandomGroupMaker() {
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [groupCount, setGroupCount] = useState(2);
  const [groups, setGroups] = useState<string[][] | null>(null);
  const [copied, setCopied] = useState(false);

  const addName = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    // Support comma-separated names
    const newNames = trimmed.split(',').map(n => n.trim()).filter(n => n);
    setNames(prev => [...prev, ...newNames]);
    setInput('');
    setGroups(null);
  };

  const removeName = (index: number) => {
    setNames(prev => prev.filter((_, i) => i !== index));
    setGroups(null);
  };

  const generate = () => {
    if (names.length < groupCount) {
      toast.error('Need at least as many names as groups');
      return;
    }
    setGroups(splitIntoGroups(names, groupCount));
  };

  const copyResults = () => {
    if (!groups) return;
    const text = groups.map((g, i) => `Group ${i + 1}: ${g.join(', ')}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Add names */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Add Members</h3>
          <span className="ml-auto text-xs text-muted-foreground">{names.length} added</span>
        </div>

        <form onSubmit={e => { e.preventDefault(); addName(); }} className="flex gap-2 mb-3">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Name or comma-separated names..."
            className="flex-1"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        {/* Name tags */}
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          <AnimatePresence>
            {names.map((name, i) => (
              <motion.span
                key={name + i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="inline-flex items-center gap-1 bg-muted text-foreground text-xs px-2.5 py-1 rounded-full"
              >
                {name}
                <button onClick={() => removeName(i)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {names.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">No members yet — add some above</p>
          )}
        </div>

        {names.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setNames([]); setGroups(null); }} className="mt-2 text-xs text-muted-foreground">
            <Trash2 className="w-3 h-3 mr-1" /> Clear all
          </Button>
        )}
      </div>

      {/* Group count */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Number of Groups</p>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => { setGroupCount(n); setGroups(null); }}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                groupCount === n
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={names.length < 2}
        className="w-full rounded-xl h-12 text-base font-semibold gap-2"
      >
        <Shuffle className="w-5 h-5" />
        {groups ? 'Reshuffle' : 'Generate Groups'}
      </Button>

      {/* Results */}
      <AnimatePresence>
        {groups && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Results</h3>
              <Button variant="ghost" size="sm" onClick={copyResults} className="gap-1 text-xs">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            {groups.map((group, gi) => (
              <motion.div
                key={gi}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.08 }}
                className="bg-card border border-border rounded-2xl p-3 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: GROUP_COLORS[gi % GROUP_COLORS.length] }}
                  >
                    {gi + 1}
                  </div>
                  <span className="text-xs font-semibold text-foreground">Group {gi + 1}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{group.length} members</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.map((name, ni) => (
                    <span
                      key={ni}
                      className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
                      style={{ backgroundColor: GROUP_COLORS[gi % GROUP_COLORS.length] + 'cc' }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
