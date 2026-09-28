import { useState } from 'react';
import { useTutorProfiles, useMyTutorProfile, useUpsertTutorProfile, useDeleteTutorProfile } from '@/hooks/useTutorProfiles';
import { useSubjects } from '@/hooks/useSubjects';
import { useUnreadMessageCount } from '@/hooks/useDirectMessages';
import { useAuth } from '@/features/auth/AuthProvider';
import { Search, X, Users, BookOpen, Clock, Star, Loader2, Trash2, MessageCircle, Inbox, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { MessageSheet } from '@/features/marketplace/components/MessageSheet';
import { InboxList } from '@/features/marketplace/components/InboxSheet';

function TutorCard({ tutor, onMessage }: { tutor: any; onMessage?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{tutor.tutor_name || 'Tutor'}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {tutor.tutor_username && <span className="text-xs text-muted-foreground">@{tutor.tutor_username}</span>}
            {tutor.tutor_faculty && <Badge variant="outline" className="text-[10px] py-0">{tutor.tutor_faculty}</Badge>}
            {tutor.tutor_semester && <span className="text-[10px] text-muted-foreground">Sem {tutor.tutor_semester}</span>}
          </div>
        </div>
        <span className="text-xs font-medium text-primary">{tutor.rate === 'free' ? 'Free' : tutor.rate}</span>
      </div>
      {tutor.bio && <p className="text-xs text-muted-foreground line-clamp-2">{tutor.bio}</p>}
      <div className="flex flex-wrap gap-1">
        {tutor.subjects?.map((s: string) => (
          <Badge key={s} variant="secondary" className="text-[10px]"><BookOpen className="w-2.5 h-2.5 mr-1" />{s}</Badge>
        ))}
      </div>
      {tutor.availability && (
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{tutor.availability}</p>
      )}
      {onMessage && (
        <Button variant="outline" size="sm" className="h-7 text-xs mt-1" onClick={onMessage}>
          <MessageCircle className="w-3 h-3 mr-1" /> Message
        </Button>
      )}
    </motion.div>
  );
}

function RegisterSheet() {
  const { data: myProfile } = useMyTutorProfile();
  const { data: subjects } = useSubjects();
  const upsert = useUpsertTutorProfile();
  const deleteTutor = useDeleteTutorProfile();
  const [open, setOpen] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [form, setForm] = useState({
    subjects: myProfile?.subjects || [] as string[],
    availability: myProfile?.availability || '',
    rate: myProfile?.rate || 'free',
    bio: myProfile?.bio || '',
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && myProfile) {
      setForm({
        subjects: myProfile.subjects || [],
        availability: myProfile.availability || '',
        rate: myProfile.rate || 'free',
        bio: myProfile.bio || '',
      });
    }
    setOpen(isOpen);
  };

  const toggleSubject = (name: string) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(name) ? f.subjects.filter(s => s !== name) : [...f.subjects, name],
    }));
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !form.subjects.includes(trimmed)) {
      setForm(f => ({ ...f, subjects: [...f.subjects, trimmed] }));
    }
    setCustomSubject('');
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant={myProfile ? 'outline' : 'default'} className="gap-1">
          <Star className="w-4 h-4" /> {myProfile ? 'Edit Profile' : 'Become a Tutor'}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{myProfile ? 'Edit Tutor Profile' : 'Register as Tutor'}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Subjects you can teach</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {subjects?.map(s => (
                <button key={s.id} onClick={() => toggleSubject(s.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${form.subjects.includes(s.name) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >{s.name}</button>
              ))}
              {/* Show custom subjects that aren't in the subjects list */}
              {form.subjects.filter(s => !subjects?.some(sub => sub.name === s)).map(s => (
                <button key={s} onClick={() => toggleSubject(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                >{s} ✕</button>
              ))}
            </div>
            {/* Custom subject input */}
            <div className="flex gap-2 mt-2">
              <Input value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                placeholder="Add custom subject..." className="flex-1 h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubject())} />
              <Button size="sm" variant="outline" className="h-8" onClick={addCustomSubject} disabled={!customSubject.trim()}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div><Label>Availability</Label><Input value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} placeholder="e.g. Weekdays 4-6 PM" /></div>
          <div><Label>Rate</Label>
            <Select value={form.rate} onValueChange={v => setForm(f => ({ ...f, rate: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="negotiable">Negotiable</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell students about your teaching style..." rows={3} /></div>
          <Button onClick={() => upsert.mutate(form, { onSuccess: () => setOpen(false) })} disabled={form.subjects.length === 0 || upsert.isPending} className="w-full">
            {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Profile
          </Button>
          {myProfile && (
            <Button variant="destructive" className="w-full" onClick={() => deleteTutor.mutate(myProfile.id, { onSuccess: () => setOpen(false) })}>
              <Trash2 className="w-4 h-4 mr-2" /> Remove Profile
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function TutorMatchmaker() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { data: tutors, isLoading } = useTutorProfiles();
  const { data: unreadCount } = useUnreadMessageCount();
  const [messageTarget, setMessageTarget] = useState<{ userId: string; name: string; tutorId: string } | null>(null);

  const filtered = tutors?.filter(t =>
    !search || t.subjects?.some(s => s.toLowerCase().includes(search.toLowerCase())) || t.bio?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Find a Tutor</h2>
        <RegisterSheet />
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="browse" className="flex-1">Browse</TabsTrigger>
          <TabsTrigger value="inbox" className="flex-1 relative">
            <Inbox className="w-4 h-4 mr-1" /> Inbox
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-8" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {filtered.map(t => (
                <TutorCard key={t.id} tutor={t}
                  onMessage={t.user_id !== user?.id ? () => setMessageTarget({ userId: t.user_id, name: t.tutor_name || 'Tutor', tutorId: t.id }) : undefined}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <p className="text-muted-foreground text-sm">No tutors found</p>
                  <p className="text-xs text-muted-foreground/80">Be the first to register!</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inbox">
          <InboxList contextType="tutor" />
        </TabsContent>
      </Tabs>

      {/* Message Sheet */}
      {messageTarget && (
        <MessageSheet
          open={!!messageTarget}
          onOpenChange={open => !open && setMessageTarget(null)}
          otherUserId={messageTarget.userId}
          otherUserName={messageTarget.name}
          contextType="tutor"
          contextId={messageTarget.tutorId}
        />
      )}
    </div>
  );
}
