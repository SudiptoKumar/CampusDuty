import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, BookOpen, GraduationCap, MessageSquare, Share2, Mail, Hash, Droplets, Lightbulb, Quote } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

interface PrivacySetting {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  warning?: string;
}

const PRIVACY_SETTINGS: PrivacySetting[] = [
  { key: 'show_bio', label: 'Bio', description: 'Show your bio on your public profile', icon: MessageSquare },
  { key: 'show_headline', label: 'Headline', description: 'Show your headline tagline', icon: Quote },
  
  { key: 'show_skills', label: 'Skills & Interests', description: 'Show your skills and interest tags', icon: Lightbulb },
  { key: 'show_social_links', label: 'Social Links', description: 'Show your social media links', icon: Share2 },
  { key: 'show_faculty', label: 'Faculty', description: 'Show which faculty you belong to', icon: BookOpen },
  { key: 'show_semester', label: 'Semester', description: 'Show your current semester', icon: GraduationCap },
  { key: 'show_email', label: 'Email', description: 'Show your email on your public profile', icon: Mail, warning: 'Your email will be visible to anyone who views your profile' },
  { key: 'show_class_id', label: 'Class ID', description: 'Show your class identifier', icon: Hash },
  { key: 'show_reg_number', label: 'Registration Number', description: 'Show your registration number', icon: Hash },
  { key: 'show_blood_group', label: 'Blood Group', description: 'Show your blood group for emergencies', icon: Droplets },
];

export function ProfilePrivacySettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const handleToggle = (key: string, value: boolean) => {
    updateProfile.mutate({ [key]: value } as any);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <Shield className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-medium">Privacy Settings</h3>
          <p className="text-xs text-muted-foreground">Control what's visible on your public profile</p>
        </div>
      </div>

      <div className="space-y-2">
        {PRIVACY_SETTINGS.map((setting) => {
          const Icon = setting.icon;
          const isVisible = (profile as any)[setting.key] ?? (setting.key === 'show_email' ? false : true);

          return (
            <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor={setting.key} className="font-medium cursor-pointer">{setting.label}</Label>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                  {setting.warning && isVisible && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">⚠️ {setting.warning}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isVisible ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                <Switch id={setting.key} checked={isVisible} onCheckedChange={(checked) => handleToggle(setting.key, checked)} disabled={updateProfile.isPending} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">Your name, username, and profile picture are always visible.</p>
    </div>
  );
}
