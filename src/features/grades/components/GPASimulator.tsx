import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, Calculator } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useGrades } from '@/hooks/useGrades';
import { useTerms } from '@/hooks/useTerms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

interface HypotheticalGrade {
  id: string;
  subjectId: string;
  value: number;
  maxScore: number;
  weight: number;
}

export function GPASimulator() {
  const { data: subjects } = useSubjects();
  const { data: grades } = useGrades();
  const { data: terms } = useTerms();
  const [hypotheticals, setHypotheticals] = useState<HypotheticalGrade[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('all');

  // Calculate current weighted average from real grades
  const currentAverage = useMemo(() => {
    const filtered = selectedTermId === 'all'
      ? grades ?? []
      : (grades ?? []).filter(g => g.term_id === selectedTermId);
    if (filtered.length === 0) return null;
    const totalWeight = filtered.reduce((sum, g) => sum + Number(g.weight), 0);
    const weightedSum = filtered.reduce(
      (sum, g) => sum + (Number(g.value) / Number(g.max_score)) * 100 * Number(g.weight), 0
    );
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [grades, selectedTermId]);

  // Calculate projected average including hypotheticals
  const projectedAverage = useMemo(() => {
    const filtered = selectedTermId === 'all'
      ? grades ?? []
      : (grades ?? []).filter(g => g.term_id === selectedTermId);
    const allGrades = [
      ...filtered.map(g => ({
        value: Number(g.value),
        maxScore: Number(g.max_score),
        weight: Number(g.weight),
      })),
      ...hypotheticals.map(h => ({
        value: h.value,
        maxScore: h.maxScore,
        weight: h.weight,
      })),
    ];
    if (allGrades.length === 0) return null;
    const totalWeight = allGrades.reduce((sum, g) => sum + g.weight, 0);
    const weightedSum = allGrades.reduce(
      (sum, g) => sum + (g.value / g.maxScore) * 100 * g.weight, 0
    );
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [grades, hypotheticals, selectedTermId]);

  const addHypothetical = () => {
    setHypotheticals(prev => [...prev, {
      id: crypto.randomUUID(),
      subjectId: subjects?.[0]?.id ?? '',
      value: 80,
      maxScore: 100,
      weight: 1,
    }]);
  };

  const updateHypothetical = (id: string, updates: Partial<HypotheticalGrade>) => {
    setHypotheticals(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const removeHypothetical = (id: string) => {
    setHypotheticals(prev => prev.filter(h => h.id !== id));
  };

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'text-green-500';
    if (pct >= 80) return 'text-blue-500';
    if (pct >= 70) return 'text-yellow-500';
    if (pct >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const diff = projectedAverage !== null && currentAverage !== null
    ? projectedAverage - currentAverage
    : null;

  return (
    <div className="space-y-6">
      {/* Term filter */}
      <div className="space-y-2">
        <Label>Term</Label>
        <Select value={selectedTermId} onValueChange={setSelectedTermId}>
          <SelectTrigger>
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {terms?.map(term => (
              <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current vs Projected */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-card p-4 rounded-2xl text-center">
          <p className="text-xs text-muted-foreground mb-1">Current Average</p>
          <p className={cn("text-2xl font-bold", currentAverage !== null ? getGradeColor(currentAverage) : '')}>
            {currentAverage !== null ? `${currentAverage.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="surface-card p-4 rounded-2xl text-center">
          <p className="text-xs text-muted-foreground mb-1">Projected Average</p>
          <p className={cn("text-2xl font-bold", projectedAverage !== null ? getGradeColor(projectedAverage) : '')}>
            {projectedAverage !== null ? `${projectedAverage.toFixed(1)}%` : '—'}
          </p>
          {diff !== null && diff !== 0 && (
            <p className={cn("text-xs font-medium mt-1", diff > 0 ? 'text-green-500' : 'text-red-500')}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Hypothetical grades */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Hypothetical Grades</h3>
          <Button variant="outline" size="sm" onClick={addHypothetical} className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {hypotheticals.length === 0 ? (
          <EmptyState
            icon={<Calculator className="w-8 h-8" />}
            title="No hypothetical grades"
            description="Add grades to see how they'd affect your average"
          />
        ) : (
          <div className="space-y-3">
            {hypotheticals.map(h => (
              <div key={h.id} className="surface-card p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <Select value={h.subjectId} onValueChange={(v) => updateHypothetical(h.id, { subjectId: v })}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeHypothetical(h.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Score</Label>
                    <Input
                      type="number"
                      min={0}
                      value={h.value}
                      onChange={e => updateHypothetical(h.id, { value: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      min={1}
                      value={h.maxScore}
                      onChange={e => updateHypothetical(h.id, { maxScore: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Weight</Label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={h.weight}
                      onChange={e => updateHypothetical(h.id, { weight: Number(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("text-sm font-medium", getGradeColor((h.value / h.maxScore) * 100))}>
                    {((h.value / h.maxScore) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}