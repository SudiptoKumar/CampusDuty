import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useHabitStore } from './useHabitStore';

export default function SettingsView() {
  const { clearAllData, habits } = useHabitStore();

  return (
    <div className="flex flex-col gap-4 py-4">
      <h3 className="font-semibold text-foreground">Settings</h3>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">Data Management</p>
            <p className="text-xs text-muted-foreground mt-1">{habits.length} habits tracked</p>
          </div>
          <Button variant="destructive" className="w-full" onClick={() => { if (confirm('Delete all habit data? This cannot be undone.')) clearAllData(); }}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
