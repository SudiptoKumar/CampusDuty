import { useState } from 'react';
import { useConversations } from '@/hooks/useDirectMessages';
import { MessageSheet } from './MessageSheet';
import { Loader2, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface InboxListProps {
  contextType?: string;
}

export function InboxList({ contextType }: InboxListProps) {
  const { data: conversations, isLoading } = useConversations(contextType);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar: string; username: string } | null>(null);
  const navigate = useNavigate();

  const openChat = (conv: typeof conversations extends (infer T)[] | undefined ? T : never) => {
    setSelectedUser({
      id: conv.other_user_id,
      name: conv.other_user_name || 'User',
      avatar: conv.other_user_avatar || '',
      username: conv.other_user_username || '',
    });
    setChatOpen(true);
  };

  const handleAvatarClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    if (username) navigate(`/u/${username}`);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  if (!conversations?.length) {
    return (
      <div className="text-center py-12 space-y-2">
        <Inbox className="w-10 h-10 mx-auto text-muted-foreground/60" />
        <p className="text-muted-foreground text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {conversations.map(conv => (
          <motion.button
            key={conv.other_user_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => openChat(conv)}
            className="w-full surface-card p-3 flex items-center gap-3 text-left"
          >
            <button
              onClick={(e) => handleAvatarClick(e, conv.other_user_username)}
              className="shrink-0"
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={conv.other_user_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {conv.other_user_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground truncate">
                  {conv.other_user_name || 'User'}
                </p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
            </div>
            {conv.unread_count > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                {conv.unread_count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
      {selectedUser && (
        <MessageSheet
          open={chatOpen}
          onOpenChange={setChatOpen}
          otherUserId={selectedUser.id}
          otherUserName={selectedUser.name}
          otherUserAvatar={selectedUser.avatar}
          otherUserUsername={selectedUser.username}
          contextType={contextType || 'marketplace'}
        />
      )}
    </>
  );
}
