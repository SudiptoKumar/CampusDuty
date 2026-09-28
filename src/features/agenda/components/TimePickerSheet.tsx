import { useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (time: string) => void;
}

interface QuickTimeOption {
  label: string;
  time: string;
}

const quickTimeOptions: QuickTimeOption[] = [
  { label: 'Morning', time: '09:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Afternoon', time: '15:00' },
  { label: 'Evening', time: '18:00' },
];

// Generate time slots in 15-minute intervals
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

function formatTimeDisplay(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function TimePickerSheet({ open, onOpenChange, value, onSelect }: TimePickerSheetProps) {
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value);
  
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const handleQuickSelect = (time: string) => {
    onSelect(time);
    onOpenChange(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedTime) {
      onSelect(selectedTime);
      onOpenChange(false);
      setShowAllTimes(false);
    }
  };

  const handleClear = () => {
    onSelect('');
    onOpenChange(false);
    setShowAllTimes(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowAllTimes(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Remind me</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-4">
          {!showAllTimes ? (
            <>
              {/* Quick Time Options */}
              <div className="grid grid-cols-2 gap-3">
                {quickTimeOptions.map((option) => {
                  const isSelected = value === option.time;
                  
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleQuickSelect(option.time)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-4 rounded-xl transition-colors',
                        'hover:bg-muted/60 active:bg-muted border border-border/50',
                        isSelected && 'bg-primary/10 border-primary/30'
                      )}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeDisplay(option.time)}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Pick a time button */}
              <Button
                variant="outline"
                className="w-full h-14 rounded-xl justify-start gap-4 text-base"
                onClick={() => setShowAllTimes(true)}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span>Pick a specific time</span>
              </Button>
              
              {value && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleClear}
                >
                  Clear reminder
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Time Grid */}
              <ScrollArea className="h-64">
                <div className="grid grid-cols-4 gap-2 pr-4">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          'py-2.5 px-2 rounded-lg text-sm transition-colors',
                          'hover:bg-muted/60 active:bg-muted',
                          isSelected && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {formatTimeDisplay(time)}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
        
        {showAllTimes && (
          <DrawerFooter className="pt-2">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAllTimes(false)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={!selectedTime}
              >
                Confirm
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
