import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePomodoroStore } from './usePomodoroStore';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export default function SettingsSheet({ open, onOpenChange }: Props) {
  const { settings, updateSettings } = usePomodoroStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle>Timer Settings</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          {[
            { label: 'Focus (min)', key: 'focusDuration' as const, value: settings.focusDuration },
            { label: 'Short Break (min)', key: 'shortBreakDuration' as const, value: settings.shortBreakDuration },
            { label: 'Long Break (min)', key: 'longBreakDuration' as const, value: settings.longBreakDuration },
            { label: 'Long Break Interval', key: 'longBreakInterval' as const, value: settings.longBreakInterval },
            { label: 'Daily Goal (sessions)', key: 'dailyGoal' as const, value: settings.dailyGoal },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <Label className="text-sm">{item.label}</Label>
              <Input
                type="number"
                value={item.value}
                onChange={e => updateSettings({ [item.key]: parseInt(e.target.value) || 1 })}
                className="w-20 h-8 text-center text-sm"
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Auto-start Breaks</Label>
            <Switch checked={settings.autoStartBreaks} onCheckedChange={v => updateSettings({ autoStartBreaks: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Auto-start Focus</Label>
            <Switch checked={settings.autoStartFocus} onCheckedChange={v => updateSettings({ autoStartFocus: v })} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
