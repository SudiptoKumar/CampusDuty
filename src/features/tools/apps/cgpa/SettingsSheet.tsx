import { useCGPAStore } from './useCGPAStore';
import type { GPAScale } from './types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const SCALES: { value: GPAScale; label: string }[] = [
  { value: 4.0, label: '4.0 Scale' },
  { value: 5.0, label: '5.0 Scale' },
  { value: 10.0, label: '10.0 Scale' },
];

export default function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { settings, updateSettings } = useCGPAStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Configure your GPA calculation preferences</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Scale */}
          <div className="space-y-2">
            <Label className="text-xs">GPA Scale</Label>
            <div className="grid grid-cols-3 gap-2">
              {SCALES.map(s => (
                <button
                  key={s.value}
                  onClick={() => updateSettings({ scale: s.value })}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    settings.scale === s.value
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rounding */}
          <div className="space-y-1">
            <Label className="text-xs">Decimal Places</Label>
            <div className="flex gap-2">
              {[1, 2, 3].map(d => (
                <button
                  key={d}
                  onClick={() => updateSettings({ roundingDecimals: d })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    settings.roundingDecimals === d
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Pass Mark */}
          <div className="space-y-1">
            <Label className="text-xs">Minimum Pass GPA</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={settings.scale}
              value={settings.passMark}
              onChange={e => updateSettings({ passMark: parseFloat(e.target.value) || 0 })}
              className="h-9 text-sm w-32"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
