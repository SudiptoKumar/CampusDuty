import { useRef, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgendaWeekStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function AgendaWeekStrip({ selectedDate, onDateSelect }: AgendaWeekStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  
  // Generate dates: 30 days before and 60 days after today
  const today = new Date();
  const dates = Array.from({ length: 90 }, (_, i) => addDays(subDays(today, 30), i));
  
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => {
    // Scroll to selected date whenever it changes
    const timeoutId = setTimeout(() => {
      if (selectedRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const element = selectedRef.current;
        const containerWidth = container.offsetWidth;
        const elementLeft = element.offsetLeft;
        const elementWidth = element.offsetWidth;
        
        container.scrollTo({
          left: elementLeft - (containerWidth / 2) + (elementWidth / 2),
          behavior: 'smooth'
        });
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [selectedDate]);

  const scrollToDate = (date: Date) => {
    onDateSelect(date);
  };

  return (
    <div className="bg-muted/30 border-b border-border">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-2 py-3 gap-1"
      >
        {dates.map((date) => {
          const selected = isSameDay(date, selectedDate);
          const todayDate = isToday(date);
          const dayIndex = date.getDay();
          
          return (
            <button
              key={date.toISOString()}
              ref={selected ? selectedRef : null}
              onClick={() => scrollToDate(date)}
              className={cn(
                'flex flex-col items-center min-w-[44px] py-2 rounded-lg transition-all flex-shrink-0'
              )}
            >
              <span className={cn(
                'text-xs font-medium mb-1',
                selected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {dayLabels[dayIndex]}
              </span>
              <span className={cn(
                'w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all',
                selected && 'bg-primary text-primary-foreground',
                todayDate && !selected && 'ring-2 ring-primary text-primary'
              )}>
                {format(date, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
