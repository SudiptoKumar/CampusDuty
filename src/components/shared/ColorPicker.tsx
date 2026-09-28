import { cn } from '@/lib/utils';
import { SUBJECT_COLORS } from '@/lib/mockData';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('grid grid-cols-6 gap-2', className)}>
      {SUBJECT_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            'w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center',
            'hover:scale-110 active:scale-95',
            value === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-white'
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        >
          {value === color.value && (
            <Check className="w-5 h-5 text-white drop-shadow-md" />
          )}
        </button>
      ))}
    </div>
  );
}
