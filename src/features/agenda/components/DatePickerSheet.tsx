import { useState } from 'react';
import { format, addDays, nextMonday } from 'date-fns';
import { Calendar as CalendarIcon, Sun, Sunrise, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface DatePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Date | undefined;
  onSelect: (date: Date) => void;
}

interface QuickOption {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getDate: () => Date;
}

const quickOptions: QuickOption[] = [
  { label: 'Today', icon: Sun, getDate: () => new Date() },
  { label: 'Tomorrow', icon: Sunrise, getDate: () => addDays(new Date(), 1) },
  { label: 'Next Week', icon: CalendarDays, getDate: () => nextMonday(new Date()) },
];

export function DatePickerSheet({ open, onOpenChange, value, onSelect }: DatePickerSheetProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleQuickSelect = (option: QuickOption) => {
    onSelect(option.getDate());
    onOpenChange(false);
    setShowCalendar(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onSelect(date);
      onOpenChange(false);
      setShowCalendar(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowCalendar(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Select Date</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6 space-y-4">
          {!showCalendar ? (
            <>
              {/* Quick Options */}
              <div className="space-y-2">
                {quickOptions.map((option) => {
                  const Icon = option.icon;
                  const date = option.getDate();
                  const isSelected = value && format(value, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                  
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleQuickSelect(option)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl transition-colors',
                        'hover:bg-muted/60 active:bg-muted',
                        isSelected && 'bg-primary/10 border border-primary/30'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(date, 'EEEE, MMM d')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Pick a date button */}
              <Button
                variant="outline"
                className="w-full h-14 rounded-xl justify-start gap-4 text-base"
                onClick={() => setShowCalendar(true)}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <span>Pick a date</span>
              </Button>
            </>
          ) : (
            <>
              {/* Calendar View */}
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={handleCalendarSelect}
                  className="rounded-xl border pointer-events-auto"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowCalendar(false)}
              >
                Back to quick options
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
