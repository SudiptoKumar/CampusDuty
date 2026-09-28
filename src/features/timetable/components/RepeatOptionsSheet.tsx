import { Check, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type RecurrenceType = Database['public']['Enums']['recurrence_type'];

interface RepeatOption {
  value: RecurrenceType | 'never' | 'daily' | 'monthly' | 'yearly';
  label: string;
  description?: string;
}

const REPEAT_OPTIONS: RepeatOption[] = [
  { value: 'weekly', label: 'Default', description: 'Every week' },
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
  { value: 'custom', label: 'Custom' },
];

interface RepeatOptionsSheetProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onSelect: (value: string) => void;
}

export function RepeatOptionsSheet({ open, onClose, value, onSelect }: RepeatOptionsSheetProps) {
  const handleSelect = (option: RepeatOption) => {
    onSelect(option.value);
    onClose();
  };
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4 flex flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <SheetTitle className="flex-1">Repeat</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 overflow-y-auto">
          {REPEAT_OPTIONS.map((option, index) => {
            // Show "Default" option separately
            if (index === 0) {
              return (
                <button
                  key="default"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors mb-4 ${
                    value === 'weekly' ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                  {value === 'weekly' && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            }
            
            const isSelected = value === option.value;
            
            return (
              <button
                key={`${option.value}-${index}`}
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  isSelected ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <span className="font-medium">{option.label}</span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
