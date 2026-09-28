import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSubject } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useTerms } from '@/hooks/useTerms';
import { useSetSubjectTeachers } from '@/hooks/useSubjectTeachers';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SUBJECT_COLORS } from '@/lib/mockData';
import { 
  ArrowLeft, 
  BookOpen, 
  Palette, 
  MapPin, 
  Users, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function AddSubjectPage() {
  const navigate = useNavigate();
  const createSubject = useCreateSubject();
  const { data: teachers } = useTeachers();
  const { data: terms } = useTerms();
  const setSubjectTeachers = useSetSubjectTeachers();
  const isMobile = useIsMobile();
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0].value);
  const [room, setRoom] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [showTermPicker, setShowTermPicker] = useState(false);
  
  const selectedTeachers = teachers?.filter(t => selectedTeacherIds.includes(t.id)) || [];
  
  const isSaving = createSubject.isPending || setSubjectTeachers.isPending;

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    
    try {
      const newSubject = await createSubject.mutateAsync({
        name: name.trim(),
        room: room.trim() || null,
        color,
        teacher_id: null, // We'll use junction table instead
        icon: notes.trim() || null,
      });
      
      // Set multiple teachers via junction table
      if (selectedTeacherIds.length > 0 && newSubject?.id) {
        await setSubjectTeachers.mutateAsync({
          subjectId: newSubject.id,
          teacherIds: selectedTeacherIds,
        });
      }
      
      navigate('/subjects');
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };
  
  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const ColorPickerContent = () => (
    <div className="grid grid-cols-5 gap-3 p-4">
      {SUBJECT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => {
            setColor(c.value);
            setShowColorPicker(false);
          }}
          className={cn(
            'w-12 h-12 rounded-full transition-all duration-200',
            'hover:scale-110 active:scale-95',
            color === c.value && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
          )}
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
  );

  const TeacherPickerContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-1 p-2 min-h-0 max-h-[40vh]">
        {teachers?.map((teacher) => {
          const isSelected = selectedTeacherIds.includes(teacher.id);
          return (
            <div
              key={teacher.id}
              onClick={() => toggleTeacher(teacher.id)}
              className={cn(
                "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 cursor-pointer",
                isSelected ? "bg-primary/10" : "hover:bg-muted"
              )}
            >
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={() => toggleTeacher(teacher.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={isSelected ? "text-primary" : ""}>
                {teacher.first_name} {teacher.last_name}
              </span>
            </div>
          );
        })}
        {(!teachers || teachers.length === 0) && (
          <p className="p-3 text-muted-foreground text-sm text-center">
            No teachers added yet
          </p>
        )}
      </div>
      <div className="p-4 border-t flex-shrink-0">
        <Button 
          onClick={() => setShowTeacherPicker(false)} 
          className="w-full"
        >
          Done ({selectedTeacherIds.length} selected)
        </Button>
      </div>
    </div>
  );

  const TermPickerContent = () => (
    <div className="space-y-1 p-2">
      {terms?.map((term) => (
        <button
          key={term.id}
          onClick={() => setShowTermPicker(false)}
          className="w-full p-3 text-left rounded-lg transition-colors hover:bg-muted"
        >
          {term.name}
        </button>
      ))}
      {(!terms || terms.length === 0) && (
        <p className="p-3 text-muted-foreground text-sm text-center">
          No terms added yet
        </p>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/subjects')}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="rounded-full px-6"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>
      
      {/* Form Content */}
      <div className="p-4 space-y-3">
        {/* Name Row */}
        <div className="surface-card rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Add a name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          
          {/* Color Row */}
          <button
            onClick={() => setShowColorPicker(true)}
            className="w-full flex items-center gap-3 p-4 border-t border-border hover:bg-muted/50 transition-colors"
          >
            <Palette className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">Pick a color</span>
            <div 
              className="w-6 h-6 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Room & Teacher */}
        <div className="surface-card rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Add a room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <button
            onClick={() => setShowTeacherPicker(true)}
            className="w-full flex items-center gap-3 p-4 border-t border-border hover:bg-muted/50 transition-colors"
          >
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className={cn(
              "flex-1 text-left truncate",
              selectedTeachers.length === 0 && "text-muted-foreground"
            )}>
              {selectedTeachers.length > 0 
                ? selectedTeachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')
                : 'Add teachers'}
            </span>
            {selectedTeachers.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {selectedTeachers.length}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Terms */}
        <button
          onClick={() => setShowTermPicker(true)}
          className="w-full surface-card rounded-xl flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
        >
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1 text-left text-muted-foreground">
            Choose terms (optional)
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Notes */}
        <div className="surface-card rounded-xl p-4">
          <Textarea
            placeholder="Add a note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[120px] border-0 p-0 resize-none focus-visible:ring-0 bg-transparent"
          />
        </div>
      </div>
      
      {/* Color Picker Sheet/Dialog */}
      {isMobile ? (
        <Sheet open={showColorPicker} onOpenChange={setShowColorPicker}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Pick a color</SheetTitle>
            </SheetHeader>
            <ColorPickerContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pick a color</DialogTitle>
            </DialogHeader>
            <ColorPickerContent />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Teacher Picker Sheet/Dialog */}
      {isMobile ? (
        <Sheet open={showTeacherPicker} onOpenChange={setShowTeacherPicker}>
          <SheetContent side="bottom" className="rounded-t-2xl h-[60vh] flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>Select teachers</SheetTitle>
            </SheetHeader>
            <TeacherPickerContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showTeacherPicker} onOpenChange={setShowTeacherPicker}>
          <DialogContent className="max-h-[60vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select teachers</DialogTitle>
            </DialogHeader>
            <TeacherPickerContent />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Term Picker Sheet/Dialog */}
      {isMobile ? (
        <Sheet open={showTermPicker} onOpenChange={setShowTermPicker}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
            <SheetHeader>
              <SheetTitle>Choose terms</SheetTitle>
            </SheetHeader>
            <TermPickerContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showTermPicker} onOpenChange={setShowTermPicker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose terms</DialogTitle>
            </DialogHeader>
            <TermPickerContent />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
