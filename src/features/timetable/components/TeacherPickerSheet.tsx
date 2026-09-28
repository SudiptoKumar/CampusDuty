import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTeachers } from '@/hooks/useTeachers';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Database } from '@/integrations/supabase/types';

type Teacher = Database['public']['Tables']['teachers']['Row'];

interface TeacherPickerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function TeacherPickerSheet({ open, onClose, selectedIds, onSelect }: TeacherPickerSheetProps) {
  const { data: teachers } = useTeachers();
  const navigate = useNavigate();
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  
  useEffect(() => {
    setLocalSelected(selectedIds);
  }, [selectedIds, open]);
  
  const toggleTeacher = (teacherId: string) => {
    setLocalSelected(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };
  
  const handleCreate = () => {
    onClose();
    navigate('/teachers/add');
  };
  
  const handleSelect = () => {
    onSelect(localSelected);
    onClose();
  };
  
  const getTeacherName = (teacher: Teacher) => 
    `${teacher.first_name} ${teacher.last_name}`;
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle>Select teachers</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {teachers?.map((teacher) => {
            const isSelected = localSelected.includes(teacher.id);
            
            return (
              <button
                key={teacher.id}
                onClick={() => toggleTeacher(teacher.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                  isSelected ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <Checkbox 
                  checked={isSelected}
                  className="pointer-events-none"
                />
                <span className="font-medium flex-1 text-left truncate">
                  {getTeacherName(teacher)}
                </span>
              </button>
            );
          })}
          
          {(!teachers || teachers.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No teachers added yet
            </div>
          )}
        </div>
        
        <div className="flex gap-3 pt-4 border-t mt-4 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={handleCreate}
            className="flex-1"
          >
            CREATE
          </Button>
          <Button 
            onClick={handleSelect}
            className="flex-1"
          >
            SELECT
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
