import { useRef, useState, useEffect } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, Loader2, Trash2, Instagram, Linkedin, Github, Twitter, 
  GraduationCap, BookOpen, Mail, Hash, Droplets, User, Lightbulb, X, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfilePrivacySettings } from './ProfilePrivacySettings';
import { ImageCropperDialog } from '@/components/shared/ImageCropperDialog';

interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'username or profile URL' },
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: 'username' },
] as const;

const FACULTIES = ['Agriculture', 'CSE', 'FBA', 'Fisheries', 'ESDM', 'NFS', 'LLA'] as const;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditSheet({ open, onOpenChange }: ProfileEditSheetProps) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localBio, setLocalBio] = useState(profile?.bio || '');
  const [localHeadline, setLocalHeadline] = useState((profile as any)?.headline || '');
  
  const [localSkills, setLocalSkills] = useState<string[]>((profile as any)?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  
  useEffect(() => {
    if (profile?.bio !== undefined) setLocalBio(profile.bio || '');
    if (profile?.social_links) setSocialLinks(profile.social_links as SocialLinks);
    if ((profile as any)?.headline !== undefined) setLocalHeadline((profile as any).headline || '');
    if ((profile as any)?.skills !== undefined) setLocalSkills((profile as any).skills || []);
  }, [profile?.bio, profile?.social_links, (profile as any)?.headline, (profile as any)?.skills]);
  
  if (!profile) return null;
  
  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageSrc(event.target?.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    await uploadAvatar(croppedBlob);
    setSelectedImageSrc(null);
  };
  
  const handleUpdate = (updates: Record<string, any>) => {
    updateProfile.mutate(updates);
  };
  
  const handleSocialLinkChange = (key: string, value: string) => {
    const newLinks = { ...socialLinks, [key]: value.trim() || undefined };
    Object.keys(newLinks).forEach(k => {
      if (!newLinks[k as keyof SocialLinks]) delete newLinks[k as keyof SocialLinks];
    });
    setSocialLinks(newLinks);
  };
  
  const handleSocialLinksBlur = () => {
    handleUpdate({ social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null });
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && localSkills.length < 10 && !localSkills.includes(trimmed)) {
      const updated = [...localSkills, trimmed];
      setLocalSkills(updated);
      setSkillInput('');
      handleUpdate({ skills: updated });
    }
  };

  const removeSkill = (index: number) => {
    const updated = localSkills.filter((_, i) => i !== index);
    setLocalSkills(updated);
    handleUpdate({ skills: updated.length > 0 ? updated : null });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit Profile
          </SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] space-y-6 pb-8">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'absolute inset-0 rounded-full flex items-center justify-center',
                  'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
                  'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary',
                  isUploading && 'opacity-100'
                )}
              >
                {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            {selectedImageSrc && (
              <ImageCropperDialog
                open={cropperOpen}
                onOpenChange={(open) => { setCropperOpen(open); if (!open) setSelectedImageSrc(null); }}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
              />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-medium">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.avatar_url ? 'Tap photo to change' : 'Add a profile photo'}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-xs">
                  <Camera className="w-3 h-3 mr-1.5" />Upload
                </Button>
                {profile.avatar_url && (
                  <Button variant="ghost" size="sm" onClick={removeAvatar} disabled={isUploading} className="text-xs text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3 mr-1.5" />Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="userName">Display Name</Label>
            <Input id="userName" defaultValue={profile.name} onBlur={(e) => handleUpdate({ name: e.target.value })} placeholder="Enter your name" maxLength={50} />
          </div>
          
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                defaultValue={profile.username || ''}
                onBlur={(e) => {
                  const value = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                  handleUpdate({ username: value || null });
                  e.target.value = value;
                }}
                placeholder="username"
                className="pl-8"
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">3-30 characters. Required for sharing.</p>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline" className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Headline
            </Label>
            <Input
              id="headline"
              value={localHeadline}
              onChange={(e) => setLocalHeadline(e.target.value)}
              onBlur={() => handleUpdate({ headline: localHeadline || null })}
              placeholder="e.g. Business Student | Tech Enthusiast"
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground text-right">{localHeadline.length}/120</p>
          </div>

          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</Label>
            <Input id="email" type="email" defaultValue={profile.email || ''} onBlur={(e) => handleUpdate({ email: e.target.value.trim() || null })} placeholder="your.email@example.com" maxLength={255} />
          </div>
          
          {/* Academic Info */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Academic Information</p>
                <p className="text-xs text-muted-foreground">Set Faculty & Semester for classroom access</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="faculty" className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Faculty</Label>
                <Select value={profile.faculty || ''} onValueChange={(value) => handleUpdate({ faculty: value || null })}>
                  <SelectTrigger id="faculty"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FACULTIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester" className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />Semester</Label>
                <Select value={profile.semester?.toString() || ''} onValueChange={(value) => handleUpdate({ semester: value ? parseInt(value) : null })}>
                  <SelectTrigger id="semester"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="class_id" className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Class ID</Label>
                <Input id="class_id" defaultValue={profile.class_id || ''} onBlur={(e) => handleUpdate({ class_id: e.target.value.trim() || null })} placeholder="e.g. FBA-5-A" maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg_number" className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Reg Number</Label>
                <Input id="reg_number" defaultValue={profile.reg_number || ''} onBlur={(e) => handleUpdate({ reg_number: e.target.value.trim() || null })} placeholder="e.g. 2021-123" maxLength={30} />
              </div>
            </div>
            {(!profile.faculty || !profile.semester) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ You must set both Faculty & Semester to access the Classroom Hub</p>
            )}
          </div>
          
          {/* Blood Group */}
          <div className="space-y-2">
            <Label htmlFor="blood_group" className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-red-400" />Blood Group</Label>
            <Select value={profile.blood_group || ''} onValueChange={(value) => handleUpdate({ blood_group: value || null })}>
              <SelectTrigger id="blood_group"><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={localBio} onChange={(e) => setLocalBio(e.target.value)} onBlur={() => handleUpdate({ bio: localBio || null })} placeholder="Tell us about yourself..." rows={3} maxLength={160} className="resize-none" />
            <p className="text-xs text-muted-foreground text-right">{localBio.length}/160</p>
          </div>

          {/* Skills & Interests */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" />Skills & Interests</Label>
            <p className="text-xs text-muted-foreground">Add up to 10 tags</p>
            <div className="flex flex-wrap gap-2">
              {localSkills.map((skill, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {skill}
                  <button onClick={() => removeSkill(i)} className="ml-0.5 hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {localSkills.length < 10 && (
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill and press Enter"
                  maxLength={30}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addSkill} disabled={!skillInput.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Social Links */}
          <div className="space-y-3">
            <Label>Social Links</Label>
            <div className="space-y-3">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.key} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Input
                      value={socialLinks[platform.key as keyof SocialLinks] || ''}
                      onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                      onBlur={handleSocialLinksBlur}
                      placeholder={platform.placeholder}
                      className="flex-1"
                      maxLength={100}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <Separator className="my-2" />
          <ProfilePrivacySettings />
        </div>
      </SheetContent>
    </Sheet>
  );
}
