import { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { useTerms } from '@/hooks/useTerms';
import { useUpdateGrade } from '@/hooks/useGrades';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type Grade = Database['public']['Tables']['grades']['Row'];
type GradeType = Database['public']['Enums']['grade_type'];

interface EditGradeFormProps {
  grade: Grade;
  onClose: () => void;
}

export function EditGradeForm({ grade, onClose }: EditGradeFormProps) {
  const { data: subjects } = useSubjects();
  const { data: terms } = useTerms();
  const updateGrade = useUpdateGrade();
  
  const [subjectId, setSubjectId] = useState(grade.subject_id);
  const [termId, setTermId] = useState(grade.term_id);
  const [value, setValue] = useState(grade.value.toString());
  const [maxScore, setMaxScore] = useState(grade.max_score.toString());
  const [weight, setWeight] = useState(grade.weight.toString());
  const [type, setType] = useState<GradeType>(grade.type);
  const [date, setDate] = useState(grade.date);
  const [notes, setNotes] = useState(grade.notes || '');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectId || !termId || !value || !date) return;
    
    await updateGrade.mutateAsync({
      id: grade.id,
      subject_id: subjectId,
      term_id: termId,
      value: parseFloat(value),
      max_score: parseFloat(maxScore),
      weight: parseFloat(weight),
      type,
      date,
      notes: notes.trim() || null,
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
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about this grade..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!subjectId || !termId || !value || updateGrade.isPending}
        >
          {updateGrade.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
