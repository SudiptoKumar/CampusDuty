import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateSharedLink, useSharedLinks, useDeleteSharedLink } from '@/hooks/useSharedLinks';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useProfile } from '@/hooks/useProfile';
import { Book, Users, Calendar, Link2, Copy, Trash2, Loader2, Share2, Check, QrCode, ExternalLink, Hash, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDataSheet({ open, onOpenChange }: ShareDataSheetProps) {
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [includeSubjects, setIncludeSubjects] = useState(true);
  const [includeTeachers, setIncludeTeachers] = useState(true);
  const [includeClasses, setIncludeClasses] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: classes } = useClasses();
  const { data: sharedLinks, isLoading: linksLoading } = useSharedLinks();
  const { data: profile } = useProfile();

  // Generate smart default title
  const defaultTitle = profile?.faculty && profile?.semester
    ? `${profile.faculty} - Semester ${profile.semester}`
    : `Campus Duty - ${format(new Date(), 'MMM d, yyyy')}`;
  const createLink = useCreateSharedLink();
  const deleteLink = useDeleteSharedLink();

  const handleCreate = () => {
    if (!includeSubjects && !includeTeachers && !includeClasses) {
      return;
    }
    createLink.mutate({
      title: title || defaultTitle,
      includeSubjects,
      includeTeachers,
      includeClasses,
    });
  };

  const getShareUrl = (token: string) => `${window.location.origin}/import/${token}`;

  const copyLink = async (token: string, id: string) => {
    const url = getShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (token: string, title: string) => {
    const url = getShareUrl(token);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Campus Duty`,
          text: `Import my campus data on Campus Duty!`,
          url,
        });
      } catch {
        // Share cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const openLink = (token: string) => {
    window.open(getShareUrl(token), '_blank');
  };

  const hasData = (subjects?.length || 0) > 0 || (teachers?.length || 0) > 0 || (classes?.length || 0) > 0;

  const toggleItems = [
    { key: 'subjects', icon: Book, label: 'Subjects', count: subjects?.length || 0, checked: includeSubjects, onChange: setIncludeSubjects, disabled: !subjects?.length },
    { key: 'teachers', icon: Users, label: 'Teachers', count: teachers?.length || 0, checked: includeTeachers, onChange: setIncludeTeachers, disabled: !teachers?.length },
    { key: 'classes', icon: Calendar, label: 'Timetable', count: classes?.length || 0, checked: includeClasses, onChange: setIncludeClasses, disabled: !classes?.length },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -20, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Share2 className="w-5 h-5 text-primary" />
            </motion.div>
            Share Your Data
          </SheetTitle>
          <SheetDescription>
            Create a shareable link so others can import your subjects, teachers, and timetable.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Create New Share */}
          <section className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">New Share Link</h3>
            
            {!hasData ? (
              <p className="text-sm text-muted-foreground">
                You don't have any data to share yet. Add subjects, teachers, or classes first.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Link Title</Label>
                  {isEditingTitle ? (
                    <Input
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      placeholder={defaultTitle}
                      className="h-9"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span className="truncate">{title || defaultTitle}</span>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label>Include</Label>
                  {toggleItems.map((item, i) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border transition-all duration-200',
                        item.checked ? 'border-primary/30 bg-primary/5' : 'border-border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={item.checked ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <item.icon className={cn('w-5 h-5 transition-colors', item.checked ? 'text-primary' : 'text-muted-foreground')} />
                        </motion.div>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.count} items</p>
                        </div>
                      </div>
                      <Switch
                        checked={item.checked}
                        onCheckedChange={item.onChange}
                        disabled={item.disabled}
                      />
                    </motion.div>
                  ))}
                </div>

                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createLink.isPending || (!includeSubjects && !includeTeachers && !includeClasses)}
                >
                  {createLink.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Share Link
                </Button>
              </>
            )}
          </section>

          {/* Existing Links */}
          <section className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Your Links</h3>
            
            {linksLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !sharedLinks?.length ? (
              <p className="text-sm text-muted-foreground">
                No share links yet. Create one above!
              </p>
            ) : (
              <div className="space-y-4">
                {sharedLinks.map((link, linkIndex) => {
                  const shareUrl = getShareUrl(link.token);
                  
                  return (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: linkIndex * 0.1, duration: 0.3 }}
                      className="rounded-2xl border border-border bg-card overflow-hidden"
                    >
                      {/* Header with title + delete */}
                      <div className="p-3 flex items-center justify-between border-b border-border/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Share2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{link.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(link.created_at), 'MMM d, yyyy')} · {link.view_count} imports
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="shrink-0 group/trash"
                          onClick={() => deleteLink.mutate(link.id)}
                          disabled={deleteLink.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive transition-transform group-hover/trash:animate-[wiggle_0.3s_ease-in-out]" />
                        </Button>
                      </div>

                      <div className="p-4 space-y-5">
                        {/* Tags */}
                        <div className="flex gap-1.5 flex-wrap justify-center">
                          {link.include_subjects && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Subjects</span>
                          )}
                          {link.include_teachers && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Teachers</span>
                          )}
                          {link.include_classes && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Timetable</span>
                          )}
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-white rounded-2xl shadow-lg">
                            <QRCodeSVG
                              value={shareUrl}
                              size={140}
                              bgColor="white"
                              fgColor="black"
                              level="M"
                              includeMargin={false}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scan to import data</span>
                          </div>
                        </div>

                        {/* OTP Code */}
                        {link.share_code && (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                              <Hash className="w-3 h-3" />
                              <span>Share Code</span>
                            </div>
                            <div className="flex gap-1.5">
                              {(link.share_code as string).split('').map((digit: string, i: number) => (
                                <div
                                  key={i}
                                  className="w-9 h-11 rounded-lg bg-card border border-border flex items-center justify-center text-lg font-bold text-primary tabular-nums shadow-sm"
                                >
                                  {digit}
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1 gap-2"
                              onClick={() => {
                                navigator.clipboard.writeText(link.share_code as string);
                                setCopiedCodeId(link.id);
                                toast.success('Code copied!');
                                setTimeout(() => setCopiedCodeId(null), 2000);
                              }}
                            >
                              {copiedCodeId === link.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              {copiedCodeId === link.id ? 'Copied!' : 'Copy Code'}
                            </Button>
                          </div>
                        )}

                        {/* Share Link */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Share Link</label>
                          <div className="flex gap-2">
                            <Input
                              value={shareUrl}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyLink(link.token, link.id)}
                              className="shrink-0"
                            >
                              {copiedId === link.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => openLink(link.token)}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Preview
                          </Button>
                          <Button
                            className="flex-1 gap-2"
                            onClick={() => handleShare(link.token, link.title)}
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
