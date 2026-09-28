import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LayoutList, List, LayoutGrid, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LayoutType = 'agenda' | 'list' | 'board';

interface AgendaSettings {
  layout: LayoutType;
  showUpcomingClasses: boolean;
  showCompleted: boolean;
  showArchived: boolean;
}

interface AgendaSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AgendaSettings;
  onSettingsChange: (settings: AgendaSettings) => void;
}

export function AgendaSettingsSheet({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: AgendaSettingsSheetProps) {
  const layouts: { type: LayoutType; label: string; icon: React.ReactNode }[] = [
    { type: 'agenda', label: 'Agenda', icon: <LayoutList className="w-8 h-8" /> },
    { type: 'list', label: 'List', icon: <List className="w-8 h-8" /> },
    { type: 'board', label: 'Board', icon: <LayoutGrid className="w-8 h-8" /> },
  ];

  const handleReset = () => {
    onSettingsChange({
      layout: 'agenda',
      showUpcomingClasses: false,
      showCompleted: true,
      showArchived: false,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-xl font-bold">Settings</SheetTitle>
        </SheetHeader>
        <div className="pt-4 pb-8 space-y-6">
          {/* Layout Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Layout
            </h3>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {layouts.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => onSettingsChange({ ...settings, layout: type })}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        'w-16 h-16 rounded-xl flex items-center justify-center transition-all',
                        settings.layout === type
                          ? 'bg-primary/10 text-primary border-2 border-primary'
                          : 'bg-background text-muted-foreground border border-border'
                      )}
                    >
                      {icon}
                    </div>
                    <span
                      className={cn(
                        'text-sm px-3 py-1 rounded-full transition-all',
                        settings.layout === type
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              View
            </h3>
            <div className="bg-muted/50 rounded-xl">
              <div className="flex items-center justify-between p-4">
                <span className="text-foreground">Upcoming classes</span>
                <Switch
                  checked={settings.showUpcomingClasses}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, showUpcomingClasses: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Filter
            </h3>
            <div className="bg-muted/50 rounded-xl divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <span className="text-foreground">Completed</span>
                <Switch
                  checked={settings.showCompleted}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, showCompleted: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-foreground">Archived</span>
                <Switch
                  checked={settings.showArchived}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, showArchived: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive"
            onClick={handleReset}
          >
            Reset All
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
