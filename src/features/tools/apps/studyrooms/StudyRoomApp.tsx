import { useState } from 'react';
import { useStudyRooms, useCreateStudyRoom, useJoinStudyRoom, useDeleteStudyRoom, useStudyRoomMembers, useLeaveStudyRoom, StudyRoom } from '@/hooks/useStudyRooms';
import { useAuth } from '@/features/auth';
import { Plus, Users, Copy, Video, LogOut, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function StudyRoomApp() {
  const { user } = useAuth();
  const { data: rooms = [], isLoading } = useStudyRooms();
  const createRoom = useCreateStudyRoom();
  const joinRoom = useJoinStudyRoom();
  const deleteRoom = useDeleteStudyRoom();
  const leaveRoom = useLeaveStudyRoom();

  const [view, setView] = useState<'list' | 'create' | 'room'>('list');
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [roomName, setRoomName] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const { data: members = [] } = useStudyRoomMembers(selectedRoom?.id || null);

  const handleCreate = () => {
    if (!roomName.trim()) { toast.error('Enter a room name'); return; }
    createRoom.mutate(
      { name: roomName.trim(), video_link: videoLink.trim() || undefined },
      {
        onSuccess: (room) => {
          toast.success('Room created!');
          setRoomName(''); setVideoLink('');
          setSelectedRoom(room as StudyRoom);
          setView('room');
        },
        onError: () => toast.error('Failed to create room'),
      }
    );
  };

  const handleJoin = () => {
    if (!joinCode.trim()) { toast.error('Enter invite code'); return; }
    joinRoom.mutate(joinCode.trim(), {
      onSuccess: (room) => {
        toast.success('Joined room!');
        setJoinCode('');
        setSelectedRoom(room as StudyRoom);
        setView('room');
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (view === 'room' && selectedRoom) {
    return (
      <div className="py-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setView('list'); setSelectedRoom(null); }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{selectedRoom.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground">Invite Code:</span>
              <code className="text-sm font-mono font-bold">{selectedRoom.invite_code}</code>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => { navigator.clipboard.writeText(selectedRoom.invite_code || ''); toast.success('Copied!'); }}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>

            {selectedRoom.video_link && (
              <Button variant="outline" className="w-full" onClick={() => window.open(selectedRoom.video_link!, '_blank')}>
                <Video className="w-4 h-4 mr-2" /> Join Video Call
              </Button>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {members.length} member(s)</p>
              <div className="space-y-1">
                {members.map(m => (
                  <div key={m.id} className="text-xs p-2 bg-card border border-border/50 rounded-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {m.user_id === user?.id ? 'You' : m.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {selectedRoom.created_by === user?.id ? (
                <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteRoom.mutate(selectedRoom.id, { onSuccess: () => { toast.success('Room deleted'); setView('list'); setSelectedRoom(null); } })}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Room
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => leaveRoom.mutate(selectedRoom.id, { onSuccess: () => { toast.success('Left room'); setView('list'); setSelectedRoom(null); } })}>
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Leave Room
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="py-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setView('list')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card>
          <CardHeader><CardTitle className="text-sm">Create Study Room</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Room name" value={roomName} onChange={e => setRoomName(e.target.value)} />
            <Input placeholder="Video call link (optional)" value={videoLink} onChange={e => setVideoLink(e.target.value)} />
            <Button onClick={handleCreate} disabled={createRoom.isPending} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Create
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter invite code" value={joinCode} onChange={e => setJoinCode(e.target.value)} className="flex-1" />
        <Button onClick={handleJoin} disabled={joinRoom.isPending} size="sm">Join</Button>
      </div>

      <Button onClick={() => setView('create')} className="w-full" variant="outline">
        <Plus className="w-4 h-4 mr-2" /> Create New Room
      </Button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No rooms yet. Create one or join with a code!</p>
      ) : (
        rooms.map(room => (
          <Card key={room.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setSelectedRoom(room); setView('room'); }}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{room.name}</p>
                <p className="text-xs text-muted-foreground">Code: {room.invite_code}</p>
              </div>
              {room.video_link && <Video className="w-4 h-4 text-muted-foreground" />}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
