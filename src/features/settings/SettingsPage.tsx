import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRIMARY_COLORS } from '@/lib/mockData';
import { Check, Moon, Sun, Monitor, Loader2, Bell, Share2, FileJson, KeyRound, WifiOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationToggle } from '@/components/shared';
import { ShareDataSheet } from './ShareDataSheet';
import { ExportImportSheet } from './ExportImportSheet';


export function SettingsPage() {
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [exportImportSheetOpen, setExportImportSheetOpen] = useState(false);
  
  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleUpdate = (updates: Record<string, any>) => {
    updateProfile.mutate(updates);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Customize your experience</p>
      </header>
      
      <div className="space-y-8">
        
        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <div className="surface-card p-4 space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => handleUpdate({ theme: theme.value })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                        profile.theme === theme.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Primary Color</Label>
              <div className="flex flex-wrap gap-3">
                {PRIMARY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleUpdate({ primary_color: color.value })}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all flex items-center justify-center',
                      'hover:scale-110 active:scale-95',
                      profile.primary_color === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-white'
                    )}
                    style={{ backgroundColor: color.value }}
                  >
                    {profile.primary_color === color.value && (
                      <Check className="w-5 h-5 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Timetable */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Timetable</h2>
          <div className="surface-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Start of Week</Label>
                <p className="text-sm text-muted-foreground">Choose your week start day</p>
              </div>
              <Select 
                value={profile.start_of_week.toString()} 
                onValueChange={(v) => handleUpdate({ start_of_week: parseInt(v) })}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Weekends</Label>
                <p className="text-sm text-muted-foreground">Display Saturday and Sunday</p>
              </div>
              <Switch
                checked={profile.show_weekends}
                onCheckedChange={(checked) => handleUpdate({ show_weekends: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Default Class Duration</Label>
                <p className="text-sm text-muted-foreground">Auto-set end time when adding classes</p>
              </div>
              <Select 
                value={profile.default_class_duration.toString()} 
                onValueChange={(v) => handleUpdate({ default_class_duration: parseInt(v) })}
              >
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
        
        {/* Notifications */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="surface-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get alerts for upcoming classes and tasks
                </p>
              </div>
              <NotificationToggle />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Class Alert Time</Label>
                <p className="text-sm text-muted-foreground">
                  Minutes before class to notify
                </p>
              </div>
              <Select 
                value={profile.class_alert_minutes.toString()} 
                onValueChange={(v) => handleUpdate({ class_alert_minutes: parseInt(v) })}
              >
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Voice Feedback */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Voice Feedback</h2>
          <div className="surface-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Text-to-Speech
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable "Read Task" button to hear tasks read aloud
                </p>
              </div>
              <Switch
                checked={profile.theme !== '__tts_disabled__'}
                onCheckedChange={(checked) => {
                  // Store TTS preference in localStorage since it's a client-side feature
                  localStorage.setItem('campus-duty-tts-enabled', checked ? 'true' : 'false');
                  // Force re-render by dispatching a storage event
                  window.dispatchEvent(new Event('tts-toggle'));
                }}
                defaultChecked={localStorage.getItem('campus-duty-tts-enabled') !== 'false'}
              />
            </div>
            {!('speechSynthesis' in window) && (
              <p className="text-xs text-destructive">
                Your browser does not support Text-to-Speech.
              </p>
            )}
          </div>
        </section>
        
        {/* Data Management */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Data Management</h2>
          <div className="surface-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share via Link
                </Label>
                <p className="text-sm text-muted-foreground">
                  Share subjects, teachers, and timetable via link
                </p>
              </div>
              <Button variant="outline" onClick={() => setShareSheetOpen(true)}>
                Share
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  Export / Import
                </Label>
                <p className="text-sm text-muted-foreground">
                  Backup or restore your data as a file
                </p>
              </div>
              <Button variant="outline" onClick={() => setExportImportSheetOpen(true)}>
                Manage
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Import via Code
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enter a 6-digit share code to import data
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/import')}>
                Import
              </Button>
            </div>
          </div>
        </section>

        {/* Offline Mode */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Offline Mode</h2>
          <div className="surface-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  Offline Study Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cache notes, schedule, and flashcards for offline use
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">Always On</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your study data is automatically cached via the service worker. When you go offline, 
              you'll still see your notes, timetable, grades, and flashcards from your last visit.
            </p>
          </div>
        </section>

        {/* Sign Out */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="surface-card p-4">
            <Button variant="destructive" onClick={signOut} className="w-full">
              Sign Out
            </Button>
          </div>
        </section>
      </div>
      
      <ShareDataSheet open={shareSheetOpen} onOpenChange={setShareSheetOpen} />
      <ExportImportSheet open={exportImportSheetOpen} onOpenChange={setExportImportSheetOpen} />
    </div>
  );
}

export default SettingsPage;
