import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, X, Save } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUpdatePost } from '@/hooks/useClassroomPosts';
import MarkdownTextarea, { type MarkdownTextareaHandle } from './MarkdownTextarea';

interface EditPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    scheduled_at: string | null;
    is_published: boolean;
  };
}

export function EditPostSheet({ open, onOpenChange, post }: EditPostSheetProps) {
  const [content, setContent] = useState(post.content);
  const [isScheduling, setIsScheduling] = useState(!!post.scheduled_at && !post.is_published);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    post.scheduled_at ? new Date(post.scheduled_at) : undefined
  );
  const [scheduledTime, setScheduledTime] = useState(
    post.scheduled_at ? format(new Date(post.scheduled_at), 'HH:mm') : '09:00'
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const editorRef = useRef<MarkdownTextareaHandle>(null);
  
  const updatePost = useUpdatePost();

  const handleSave = () => {
    let scheduledAt: string | undefined;
    
    if (isScheduling && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const dateTime = new Date(scheduledDate);
      dateTime.setHours(hours, minutes, 0, 0);
      scheduledAt = dateTime.toISOString();
    }
    
    updatePost.mutate({
      postId: post.id,
      content: content.trim(),
      scheduledAt: isScheduling ? scheduledAt : null,
      isPublished: !isScheduling,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const clearSchedule = () => {
    setIsScheduling(false);
    setScheduledDate(undefined);
    setScheduledTime('09:00');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Edit Post</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div>
            <Label>Content</Label>
            <div className="mt-1.5">
              <MarkdownTextarea
                ref={editorRef}
                value={content}
                onChange={setContent}
                placeholder="Write your post content..."
                minHeight="150px"
                maxHeight="300px"
              />
            </div>
          </div>
          
          {/* Schedule Section */}
          {!post.is_published && (
            <>
              {isScheduling ? (
                <div className="p-3 rounded-lg bg-muted/50 border border-dashed space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Schedule Post
                    </Label>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearSchedule}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline"
                          className={cn("flex-1 justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single" selected={scheduledDate}
                          onSelect={(date) => { setScheduledDate(date); setCalendarOpen(false); }}
                          disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-32" />
                  </div>
                  
                  {scheduledDate && (
                    <Badge variant="secondary" className="text-xs">
                      Will publish on {format(scheduledDate, 'PPP')} at {scheduledTime}
                    </Badge>
                  )}
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => setIsScheduling(true)} className="gap-1.5">
                  <Clock className="h-4 w-4" />
                  Schedule for later
                </Button>
              )}
            </>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave}
              disabled={!content.trim() || updatePost.isPending || (isScheduling && !scheduledDate)}
              className="flex-1 gap-1.5">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
