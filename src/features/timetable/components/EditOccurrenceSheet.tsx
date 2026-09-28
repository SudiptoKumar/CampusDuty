import { useState, useEffect } from 'react';
import { X, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RepeatOptionsSheet } from './RepeatOptionsSheet';
import { DAY_NAMES } from '@/lib/mockData';
import { useClasses } from '@/hooks/useClasses';
import type { Database } from '@/integrations/supabase/types';
import { Occurrence } from './AddOccurrenceSheet';

type RecurrenceType = Database['public']['Enums']['recurrence_type'];

interface EditOccurrenceSheetProps {
  open: boolean;
  onClose: () => void;
  occurrence: Occurrence;
  onSave: (occurrence: Occurrence) => void;
  existingOccurrences?: Occurrence[];
  currentIndex?: number;
}

const REPEAT_LABELS: Record<string, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  custom: 'Custom',
};

export function EditOccurrenceSheet({ open, onClose, occurrence, onSave, existingOccurrences = [], currentIndex }: EditOccurrenceSheetProps) {
  const { data: allClasses } = useClasses();
  
  const [day, setDay] = useState(occurrence.day);
  const [startTime, setStartTime] = useState(occurrence.startTime);
  const [endTime, setEndTime] = useState(occurrence.endTime);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(occurrence.recurrence);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  
  useEffect(() => {
    setDay(occurrence.day);
    setStartTime(occurrence.startTime);
    setEndTime(occurrence.endTime);
    setRecurrence(occurrence.recurrence);
  }, [occurrence]);
  
  // Check for time conflicts
  const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = toMinutes(start1), e1 = toMinutes(end1);
    const s2 = toMinutes(start2), e2 = toMinutes(end2);
    return s1 < e2 && s2 < e1;
  };
  
  const checkTimeConflict = (checkDay: number, checkStart: string, checkEnd: string) => {
    // Check against other occurrences in current form (excluding self)
    const localConflict = existingOccurrences.find((occ, idx) => 
      idx !== currentIndex &&
      occ.day === checkDay && 
      occ.recurrence === 'weekly' &&
      hasTimeOverlap(occ.startTime, occ.endTime, checkStart, checkEnd)
    );
    
    if (localConflict) {
      return `This time slot overlaps with another occurrence`;
    }
    
    // Check against classes already saved in database (excluding the one being edited)
    const dbConflict = allClasses?.find(cls => 
      cls.id !== occurrence.id &&
      cls.day === checkDay &&
      cls.recurrence === 'weekly' &&
      hasTimeOverlap(cls.start_time.slice(0, 5), cls.end_time.slice(0, 5), checkStart, checkEnd)
    );
    
    if (dbConflict) {
      return `This time slot conflicts with an existing class`;
    }
    
    return null;
  };
  
  const conflictMessage = checkTimeConflict(day, startTime, endTime);
  
  const handleSave = () => {
    if (conflictMessage) return;
    
    onSave({
      ...occurrence,
      day,
      startTime,
      endTime,
      recurrence,
    });
    onClose();
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-24">
          <SheetHeader className="flex flex-row items-center justify-between pb-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-5 h-5" />
            </Button>
            <SheetTitle className="sr-only">Edit Occurrence</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            {/* Day */}
            <button
              onClick={() => setShowDayPicker(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50"
            >
              <span className="text-muted-foreground">Day</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{DAY_NAMES[day]}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
            
            {/* Time */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">Time</span>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-auto bg-background rounded-lg"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-auto bg-background rounded-lg"
                />
              </div>
            </div>
            
            {/* Conflict Warning */}
            {conflictMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{conflictMessage}</span>
              </div>
            )}
            
            {/* Repeat */}
            <button
              onClick={() => setShowRepeatPicker(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50"
            >
              <span className="text-muted-foreground">Repeat</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{REPEAT_LABELS[recurrence] || 'Every week'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </div>
          
          {/* Save FAB */}
          <Button
            onClick={handleSave}
            size="icon"
            disabled={!!conflictMessage}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-xl shadow-lg"
          >
            <Check className="w-6 h-6" />
          </Button>
        </SheetContent>
      </Sheet>
      
      {/* Day Picker Sheet */}
      <Sheet open={showDayPicker} onOpenChange={setShowDayPicker}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Select Day</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {DAY_NAMES.map((name, index) => (
              <button
                key={index}
                onClick={() => {
                  setDay(index);
                  setShowDayPicker(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  day === index ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <span className="font-medium">{name}</span>
                {day === index && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      
      <RepeatOptionsSheet
        open={showRepeatPicker}
        onClose={() => setShowRepeatPicker(false)}
        value={recurrence}
        onSelect={(v) => setRecurrence(v as RecurrenceType)}
      />
    </>
  );
}
