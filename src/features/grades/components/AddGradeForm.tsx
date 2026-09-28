import { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { useTerms, useCreateTerm } from '@/hooks/useTerms';
import { useCreateGrade } from '@/hooks/useGrades';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type GradeType = Database['public']['Enums']['grade_type'];

interface AddGradeFormProps {
  onClose: () => void;
}

export function AddGradeForm({ onClose }: AddGradeFormProps) {
  const { data: subjects } = useSubjects();
  const { data: terms } = useTerms();
  const createGrade = useCreateGrade();
  const createTerm = useCreateTerm();
  
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');
  const [value, setValue] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [weight, setWeight] = useState('1');
  const [type, setType] = useState<GradeType>('written');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // For creating new term
  const [showNewTerm, setShowNewTerm] = useState(false);
  const [newTermName, setNewTermName] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectId || !value || !date) return;
    
    let finalTermId = termId;
    
    // Create term if needed
    if (!termId && newTermName.trim()) {
      const today = new Date();
      const result = await createTerm.mutateAsync({
        name: newTermName.trim(),
        start_date: today.toISOString().split('T')[0],
        end_date: new Date(today.setMonth(today.getMonth() + 4)).toISOString().split('T')[0],
      });
      finalTermId = result.id;
    }
    
    if (!finalTermId) return;
    
    await createGrade.mutateAsync({
      subject_id: subjectId,
      term_id: finalTermId,
      value: parseFloat(value),
      max_score: parseFloat(maxScore),
      weight: parseFloat(weight),
      type,
      date,
    });
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects?.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: subject.color }} 
                  />
                  {subject.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Term</Label>
        {!showNewTerm ? (
          <>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent>
                {terms?.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(!terms || terms.length === 0) && (
              <Button 
                type="button" 
                variant="link" 
                className="px-0 h-auto"
                onClick={() => setShowNewTerm(true)}
              >
                + Create first term
              </Button>
            )}
          </>
        ) : (
          <Input
            placeholder="e.g., Fall 2024"
            value={newTermName}
            onChange={(e) => setNewTermName(e.target.value)}
          />
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value">Grade</Label>
          <Input
            id="value"
            type="number"
            step="0.1"
            placeholder="85"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxScore">Max</Label>
          <Input
            id="maxScore"
            type="number"
            step="0.1"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as GradeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="written">Written</SelectItem>
              <SelectItem value="oral">Oral</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="participation">Participation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!subjectId || !value || (!termId && !newTermName.trim()) || createGrade.isPending}
        >
          {createGrade.isPending ? 'Adding...' : 'Add Grade'}
        </Button>
      </div>
    </form>
  );
}
