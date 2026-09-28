import { useState } from 'react';
import { useCGPAStore } from './useCGPAStore';
import { ALL_GRADES, gradeToPoints, getGradeColor } from './utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus } from 'lucide-react';

interface AddCourseSheetProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function AddCourseSheet({ open, onOpenChange }: AddCourseSheetProps) {
  const { selectedSemesterId, addCourse, settings } = useCGPAStore();
  const [name, setName] = useState('');
  const [creditHours, setCreditHours] = useState(3);
  const [grade, setGrade] = useState('A');
  const [includeInCGPA, setInclude] = useState(true);
  const [isRetake, setRetake] = useState(false);

  const impact = gradeToPoints(grade, settings.scale) * creditHours;

  const reset = () => { setName(''); setCreditHours(3); setGrade('A'); setInclude(true); setRetake(false); };

  const handleAdd = () => {
    if (!selectedSemesterId) return;
    addCourse(selectedSemesterId, {
      name: name.trim() || `Course`,
      creditHours, grade, includeInCGPA, isRetake,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Course</SheetTitle>
          <SheetDescription>Add a new course to this semester</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs">Course Name</Label>
            <Input placeholder="e.g. Data Structures" value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
          </div>

          {/* Credit Hours Stepper */}
          <div className="space-y-1">
            <Label className="text-xs">Credit Hours</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCreditHours(Math.max(1, creditHours - 1))} disabled={creditHours <= 1}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-bold text-foreground w-8 text-center">{creditHours}</span>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCreditHours(Math.min(10, creditHours + 1))} disabled={creditHours >= 10}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Grade Grid */}
          <div className="space-y-1">
            <Label className="text-xs">Grade</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                    grade === g
                      ? 'text-white shadow-md scale-105'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                  style={grade === g ? { backgroundColor: getGradeColor(g) } : undefined}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Include in CGPA</Label>
            <Switch checked={includeInCGPA} onCheckedChange={setInclude} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Retake</Label>
            <Switch checked={isRetake} onCheckedChange={setRetake} />
          </div>

          {/* Impact Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-3 text-center text-white">
            <p className="text-xs text-white/80">This course will contribute</p>
            <p className="text-2xl font-extrabold">{impact.toFixed(1)}</p>
            <p className="text-[10px] text-white/70">quality points</p>
          </div>

          <Button className="w-full" onClick={handleAdd}>Add Course</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
