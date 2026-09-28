import { useCGPAStore } from './useCGPAStore';
import { calculateSemesterGPA, qualityPoints, getGradeColor } from './utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface SemesterDetailViewProps {
  onOpenAddCourse: () => void;
}

export default function SemesterDetailView({ onOpenAddCourse }: SemesterDetailViewProps) {
  const { semesters, settings, selectedSemesterId, selectSemester, removeSemester, renameSemester, removeCourse } = useCGPAStore();
  const semester = semesters.find(s => s.id === selectedSemesterId);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!semester) {
    return (
      <div className="p-6 text-center text-muted-foreground pb-20">
        <p>Select a semester from the Dashboard.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => selectSemester(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  const semGPA = calculateSemesterGPA(semester.courses, settings.scale, settings.roundingDecimals);
  const credits = semester.courses.filter(c => c.includeInCGPA).reduce((s, c) => s + c.creditHours, 0);

  const startEdit = () => { setEditName(semester.name); setEditing(true); };
  const saveEdit = () => { renameSemester(semester.id, editName.trim() || semester.name); setEditing(false); };

  return (
    <div className="space-y-4 pb-20">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => selectSemester(null)} className="gap-1 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Button>

      {/* Hero */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-500 border-0 text-white">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <CardContent className="p-5 relative z-10">
          <div className="flex items-center gap-2">
            {editing ? (
              <div className="flex items-center gap-1">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/50 w-40" onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                <button onClick={saveEdit} className="p-1"><Check className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <p className="text-sm text-white/80 font-medium">{semester.name}</p>
                <button onClick={startEdit} className="p-0.5 hover:bg-white/20 rounded"><Edit2 className="w-3 h-3" /></button>
              </>
            )}
          </div>
          <p className="text-4xl font-extrabold mt-1">{semGPA.toFixed(settings.roundingDecimals)}</p>
          <p className="text-xs text-white/70 mt-1">{semester.courses.length} courses · {credits} credits</p>
        </CardContent>
      </Card>

      {/* Course List */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Courses</h3>
        <Button size="sm" variant="outline" onClick={onOpenAddCourse} className="gap-1 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Course
        </Button>
      </div>

      {semester.courses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No courses yet.</p>
            <Button size="sm" className="mt-3 gap-1" onClick={onOpenAddCourse}>
              <Plus className="w-4 h-4" /> Add Course
            </Button>
          </CardContent>
        </Card>
      )}

      {semester.courses.map((course, i) => {
        const qp = qualityPoints(course, settings.scale);
        const color = getGradeColor(course.grade);
        return (
          <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: color }}>
                  {course.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{course.name}</p>
                  <p className="text-xs text-muted-foreground">{course.creditHours} cr · {qp} pts{course.isRetake ? ' · Retake' : ''}{!course.includeInCGPA ? ' · Excluded' : ''}</p>
                </div>
                <button onClick={() => removeCourse(semester.id, course.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Delete semester */}
      <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs" onClick={() => { removeSemester(semester.id); selectSemester(null); }}>
        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Semester
      </Button>
    </div>
  );
}
