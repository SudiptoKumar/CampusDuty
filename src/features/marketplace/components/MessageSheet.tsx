import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatMessages, useSendMessage, useMarkAsRead } from '@/hooks/useDirectMessages';
import { useAuth } from '@/features/auth/AuthProvider';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ArrowLeft, Shield, X, Reply, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '👏', '💡', '😂'];

interface MessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserUsername?: string;
  contextType: string;
  contextId?: string;
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function MessageSheet({ open, onOpenChange, otherUserId, otherUserName, otherUserAvatar, otherUserUsername, contextType, contextId }: MessageSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: messages, isLoading } = useChatMessages(open ? otherUserId : null);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead(open ? otherUserId : null);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Client-side reactions (UI-only, resets on reload)
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; isMine: boolean } | null>(null);

  useEffect(() => {
    if (open && otherUserId) markAsRead.mutate();
  }, [open, otherUserId, messages?.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages?.length]);

  // Close reaction picker on outside tap
  useEffect(() => {
    if (!activeReactionMsgId) return;
    const handler = () => setActiveReactionMsgId(null);
    const timer = setTimeout(() => document.addEventListener('touchstart', handler, { once: true }), 100);
    return () => { clearTimeout(timer); document.removeEventListener('touchstart', handler); };
  }, [activeReactionMsgId]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ receiverId: otherUserId, content: text.trim(), contextType, contextId });
    setText('');
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const handleLongPressStart = useCallback((msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveReactionMsgId(msgId);
    }, 400);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleReaction = (msgId: string, emoji: string) => {
    setMessageReactions(prev => {
      if (prev[msgId] === emoji) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: emoji };
    });
    setActiveReactionMsgId(null);
  };

  const initials = otherUserName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  const handleProfileClick = () => {
    if (otherUserUsername) {
      onOpenChange(false);
      navigate(`/u/${otherUserUsername}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] h-[92vh] flex flex-col p-0 gap-0">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-3 py-3 flex items-center gap-3 shrink-0 rounded-t-2xl">
          <button onClick={() => onOpenChange(false)} className="text-primary-foreground/80 hover:text-primary-foreground p-1 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={handleProfileClick} className="shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-primary-foreground/20">
              <AvatarImage src={otherUserAvatar || undefined} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
          <button onClick={handleProfileClick} className="flex-1 min-w-0 text-left">
            <SheetTitle className="text-primary-foreground text-sm font-semibold truncate">{otherUserName}</SheetTitle>
            <p className="text-primary-foreground/50 text-[10px] leading-tight">
              {otherUserUsername ? `@${otherUserUsername}` : 'Campus Duty Chat'}
            </p>
          </button>
        </div>

        {/* ── Chat area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3 min-h-0"
          style={{
            backgroundColor: 'hsl(var(--muted) / 0.2)',
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.02) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {messages?.map((msg, idx) => {
            const msgDate = new Date(msg.created_at);
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
            const showDateSeparator = !prevDate || !isSameDay(msgDate, prevDate);
            const isMine = msg.sender_id === user?.id;
            const isSameSenderAsPrev = prevMsg && prevMsg.sender_id === msg.sender_id && !showDateSeparator;
            const reaction = messageReactions[msg.id];

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="text-[10px] bg-card/90 text-muted-foreground px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-border/30">
                      {formatMessageDate(msgDate)}
                    </span>
                  </div>
                )}

                <div className={cn(
                  'flex',
                  isMine ? 'justify-end' : 'justify-start',
                  isSameSenderAsPrev ? 'mt-0.5' : 'mt-2.5'
                )}>
                  {/* Other user avatar (only first in group) */}
                  {!isMine && !isSameSenderAsPrev && (
                    <Avatar className="h-7 w-7 mr-1.5 mt-auto shrink-0">
                      <AvatarImage src={otherUserAvatar || undefined} />
                      <AvatarFallback className="text-[9px] bg-muted font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  {!isMine && isSameSenderAsPrev && <div className="w-7 mr-1.5 shrink-0" />}

                  <div className="relative max-w-[78%] group">
                    {/* Reaction picker */}
                    <AnimatePresence>
                      {activeReactionMsgId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            'absolute z-50 flex items-center gap-0.5 bg-card border border-border rounded-full px-1.5 py-1 shadow-xl',
                            isMine ? 'bottom-full right-0 mb-1' : 'bottom-full left-0 mb-1'
                          )}
                        >
                          {REACTION_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                              className={cn(
                                'text-lg hover:scale-125 transition-transform px-1 py-0.5 rounded-full',
                                reaction === emoji ? 'bg-primary/10 scale-110' : 'hover:bg-muted'
                              )}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyTo({ id: msg.id, content: msg.content, isMine }); setActiveReactionMsgId(null); }}
                            className="px-1.5 py-0.5 rounded-full hover:bg-muted transition-colors"
                          >
                            <Reply className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Message bubble */}
                    <div
                      onTouchStart={() => handleLongPressStart(msg.id)}
                      onTouchEnd={handleLongPressEnd}
                      onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsgId(msg.id); }}
                      className={cn(
                        'relative px-3 py-2 select-none',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                          : 'bg-card text-card-foreground rounded-2xl rounded-bl-sm border border-border/40',
                        isSameSenderAsPrev && isMine && 'rounded-tr-2xl rounded-br-sm',
                        isSameSenderAsPrev && !isMine && 'rounded-tl-2xl rounded-bl-sm',
                      )}
                    >
                      {/* Quoted reply */}
                      {/* TODO: persist reply references in DB for real quote support */}

                      <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                      <div className={cn('flex items-center gap-1 mt-0.5', isMine ? 'justify-end' : 'justify-start')}>
                        <span className={cn('text-[10px]', isMine ? 'text-primary-foreground/50' : 'text-muted-foreground')}>
                          {format(msgDate, 'h:mm a')}
                        </span>
                        {isMine && (
                          msg.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-primary/70" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-primary-foreground/40" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Reaction pill */}
                    {reaction && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'absolute -bottom-2.5 px-1.5 py-0.5 rounded-full bg-card border border-border shadow-sm text-xs cursor-pointer',
                          isMine ? 'right-2' : 'left-2'
                        )}
                        onClick={() => handleReaction(msg.id, reaction)}
                      >
                        {reaction}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {messages?.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary/40" />
              </div>
              <p className="text-foreground text-sm font-medium">Start a conversation</p>
              <p className="text-muted-foreground text-xs text-center max-w-[200px]">Messages are private between you and {otherUserName}</p>
            </div>
          )}
        </div>

        {/* ── Reply preview ── */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-muted/50 border-t border-border"
            >
              <div className="px-4 py-2 flex items-center gap-2">
                <Reply className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-primary">{replyTo.isMine ? 'You' : otherUserName}</p>
                  <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input area ── */}
        <div className="bg-background border-t border-border px-2 py-2 flex items-end gap-2 shrink-0">
          <div className="flex-1 bg-muted/60 rounded-2xl px-4 py-2.5 flex items-center border border-border/30">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="bg-transparent w-full text-sm focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className={cn(
              'h-10 w-10 rounded-full shrink-0 transition-all',
              text.trim() ? 'bg-primary scale-100' : 'bg-muted text-muted-foreground scale-95'
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Auto-delete notice */}
        <p className="text-[10px] text-muted-foreground/60 text-center pb-2 bg-background">
          Messages auto-delete after 7 days
        </p>
      </SheetContent>
    </Sheet>
  );
}
