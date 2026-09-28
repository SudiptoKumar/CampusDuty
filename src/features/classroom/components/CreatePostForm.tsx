import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ImagePlus, Paperclip, Hash, Globe, Lock, Clock, Send, X, Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/hooks/useProfile';
import { usePermission } from '@/hooks/usePermission';
import { useCreatePost } from '@/hooks/useClassroomPosts';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import MarkdownTextarea, { type MarkdownTextareaHandle } from './MarkdownTextarea';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const IMAGE_MAX_SIZE = 500 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALL_TYPES = [...IMAGE_TYPES, ...DOC_TYPES];

export function CreatePostForm() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isCR, isAdmin } = usePermission('student');
  const { data: subjects } = useSubjects();
  const createPost = useCreatePost();
  const editorRef = useRef<MarkdownTextareaHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'everyone' | 'admin'>('everyone');
  const [scheduledAt, setScheduledAt] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const canSchedule = isCR || isAdmin;
  const hasContent = content.trim().length > 0 || attachments.length > 0;

  // Collapse on outside click if empty
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && !hasContent) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded, hasContent]);

  const uploadFiles = useCallback(async (files: FileList, acceptTypes: string[]) => {
    if (!user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!acceptTypes.includes(file.type)) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (!file.type.startsWith('image/') && file.size > MAX_FILE_SIZE) {
          toast.error(`File too large (max 3MB): ${file.name}`);
          continue;
        }
        let uploadFile: File | Blob = file;
        if (file.type.startsWith('image/') && file.size > IMAGE_MAX_SIZE) {
          try {
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, Math.sqrt(IMAGE_MAX_SIZE / file.size));
            canvas.width = bitmap.width * scale;
            canvas.height = bitmap.height * scale;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', 0.8));
            uploadFile = blob;
          } catch { uploadFile = file; }
        }
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('classroom-files').upload(path, uploadFile);
        if (error) { toast.error(`Upload failed: ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from('classroom-files').getPublicUrl(path);
        setAttachments(prev => [...prev, { name: file.name, url: urlData.publicUrl, type: file.type, size: file.size }]);
      }
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await uploadFiles(e.target.files, IMAGE_TYPES);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }, [uploadFiles]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const mdFiles: File[] = [];
    const otherFiles: File[] = [];
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['md', 'markdown', 'txt'].includes(ext || '')) {
        mdFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    }
    // Import markdown files as content
    if (mdFiles.length > 0) {
      const text = await mdFiles[0].text();
      editorRef.current?.setMarkdown(text);
      setContent(text);
      setExpanded(true);
    }
    // Upload other files normally
    if (otherFiles.length > 0) {
      const dt = new DataTransfer();
      otherFiles.forEach(f => dt.items.add(f));
      await uploadFiles(dt.files, ALL_TYPES);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFiles]);

  const addTag = useCallback((t: string) => {
    const tag = t.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
  }, [tags]);

  const handleSubmit = useCallback(async () => {
    const md = editorRef.current?.getMarkdown() || content;
    if (!md.trim()) { toast.error('Write something first'); return; }
    if (!profile?.faculty || !profile?.semester) { toast.error('Set your faculty & semester first'); return; }

    createPost.mutate({
      content: md,
      faculty: profile.faculty,
      semester: profile.semester,
      attachments: attachments.length > 0 ? attachments : undefined,
      visibility,
      tags,
      scheduledAt: scheduledAt || undefined,
    }, {
      onSuccess: () => {
        setContent('');
        setTags([]);
        setAttachments([]);
        setScheduledAt('');
        setVisibility('everyone');
        setExpanded(false);
        editorRef.current?.setMarkdown('');
      }
    });
  }, [content, profile, attachments, visibility, tags, scheduledAt, createPost]);

  const removeAttachment = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  // Subject names for tag suggestions
  const subjectTags = (subjects || []).map(s => s.name);

  return (
    <div ref={containerRef} className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Editor area */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {(profile?.name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <MarkdownTextarea
            ref={editorRef}
            value={content}
            onChange={setContent}
            placeholder="Share with your class..."
            minHeight={expanded ? '80px' : '48px'}
            maxHeight="200px"
            onFocus={() => setExpanded(true)}
            showToolbar={expanded}
          />
        </div>
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {att.type.startsWith('image/') ? '🖼️' : '📄'} {att.name.length > 20 ? att.name.slice(0, 18) + '…' : att.name}
              <button onClick={() => removeAttachment(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Tag pills */}
      {tags.length > 0 && (
        <div className="px-4 py-1 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              #{tag}
              <button onClick={() => setTags(prev => prev.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Scheduled indicator */}
      {scheduledAt && (
        <div className="px-4 py-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Scheduled: {new Date(scheduledAt).toLocaleString()}
            <button onClick={() => setScheduledAt('')} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
          </span>
        </div>
      )}

      {/* Bottom toolbar - only show when expanded */}
      {expanded && (
        <div className="border-t border-border px-3 py-2 flex items-center gap-1">
          {/* Photo upload */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Add photo"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <input ref={imageInputRef} type="file" multiple accept={IMAGE_TYPES.join(',')} onChange={handleImageUpload} className="hidden" />

          {/* File attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Attach file"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" multiple accept={[...ALL_TYPES, '.md', '.markdown', '.txt'].join(',')} onChange={handleFileUpload} className="hidden" />

          {/* Tag input with subject suggestions */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Add tag">
                <Hash className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="start">
              <Input
                placeholder="Tag name"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                className="h-8 text-xs"
              />
              {subjectTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {subjectTags.filter(st => !tags.includes(st)).slice(0, 6).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => addTag(st)}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      #{st}
                    </button>
                  ))}
                </div>
              )}
              <Button size="sm" variant="ghost" onClick={() => addTag(tagInput)} className="w-full mt-1.5 h-7 text-xs">Add</Button>
            </PopoverContent>
          </Popover>

          {/* Privacy toggle */}
          <button
            type="button"
            onClick={() => setVisibility(v => v === 'everyone' ? 'admin' : 'everyone')}
            className={`p-2 rounded-lg transition-colors ${
              visibility === 'admin'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={visibility === 'everyone' ? 'Public' : 'Private'}
          >
            {visibility === 'everyone' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>

          {/* Schedule - Admin/CR only */}
          {canSchedule && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`p-2 rounded-lg transition-colors ${
                    scheduledAt ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title="Schedule"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <label className="text-xs font-medium text-muted-foreground">Schedule for</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="mt-1 h-8 text-xs"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Post button */}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createPost.isPending || !hasContent}
            className="ml-auto gap-1.5 rounded-full px-4 h-8 text-xs font-semibold"
          >
            {createPost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {scheduledAt ? 'Schedule' : 'Post'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CreatePostForm;
