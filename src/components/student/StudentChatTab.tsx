import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StudentChatTabProps {
  language: 'en' | 'bn';
}

interface ChatRoom {
  id: string;
  name: string;
  room_type: 'group' | 'direct';
  course_id: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null };
}

interface TeacherContact {
  profile_id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

const translations = {
  en: {
    title: 'Messages',
    groupChat: 'Group Chat',
    directMessage: 'Direct Message',
    typeMessage: 'Type a message...',
    noRooms: 'No conversations yet',
    startChat: 'Message a teacher to start chatting',
    noMessages: 'No messages yet',
    startConversation: 'Start the conversation!',
    selectRoom: 'Select a chat to start messaging',
    teachers: 'Your Teachers',
    noTeachers: 'Enroll in a course to message its teachers',
    rooms: 'Conversations',
    message: 'Message',
  },
  bn: {
    title: 'মেসেজ',
    groupChat: 'গ্রুপ চ্যাট',
    directMessage: 'ডাইরেক্ট মেসেজ',
    typeMessage: 'মেসেজ লিখুন...',
    noRooms: 'কোনো কথোপকথন নেই',
    startChat: 'টিচারকে মেসেজ দিয়ে চ্যাট শুরু করুন',
    noMessages: 'কোনো মেসেজ নেই',
    startConversation: 'কথোপকথন শুরু করুন!',
    selectRoom: 'মেসেজ করতে একটি চ্যাট নির্বাচন করুন',
    teachers: 'আপনার টিচার',
    noTeachers: 'কোর্সে ভর্তি হলে টিচারকে মেসেজ পাঠাতে পারবেন',
    rooms: 'কথোপকথন',
    message: 'মেসেজ',
  },
};

export default function StudentChatTab({ language }: StudentChatTabProps) {
  const { user, profile } = useAuth();
  const t = translations[language];

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [teachers, setTeachers] = useState<TeacherContact[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchRooms = async () => {
    if (!user?.uid) return;
    try {
      const { data: memberRooms, error } = await supabase
        .from('chat_room_members')
        .select('chat_rooms(*)')
        .eq('user_id', user.uid);
      if (error) throw error;
      const list = (memberRooms || [])
        .map((mr: any) => mr.chat_rooms)
        .filter(Boolean) as ChatRoom[];
      setRooms(list);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchTeachers = async () => {
    if (!user?.uid) return;
    try {
      // 1. Get student's active enrolled course IDs
      const { data: enrollments, error: enrErr } = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('user_id', user.uid)
        .eq('is_active', true);
      if (enrErr) throw enrErr;
      const courseIds = [...new Set((enrollments || []).map((e) => e.course_id))];
      if (courseIds.length === 0) {
        setTeachers([]);
        return;
      }

      // 2. Owner teachers via courses.teacher_id
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, teacher_id')
        .in('id', courseIds);
      const ownerProfileIds = [
        ...new Set((coursesData || []).map((c: any) => c.teacher_id).filter(Boolean)),
      ];

      // 3. Co-instructor teachers via course_instructors -> team_members -> profiles
      const { data: ciRows } = await supabase
        .from('course_instructors')
        .select('instructor_id')
        .in('course_id', courseIds);
      const teamMemberIds = [
        ...new Set((ciRows || []).map((r: any) => r.instructor_id).filter(Boolean)),
      ];

      let coProfileIds: string[] = [];
      if (teamMemberIds.length > 0) {
        const { data: linkedProfiles } = await supabase
          .from('profiles')
          .select('id')
          .in('linked_team_member_id', teamMemberIds);
        coProfileIds = (linkedProfiles || []).map((p: any) => p.id);
      }

      const allProfileIds = [...new Set([...ownerProfileIds, ...coProfileIds])];
      if (allProfileIds.length === 0) {
        setTeachers([]);
        return;
      }

      const { data: teacherProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('id', allProfileIds)
        .neq('user_id', user.uid);
      if (profErr) throw profErr;

      setTeachers(
        (teacherProfiles || []).map((p: any) => ({
          profile_id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        })),
      );
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const senderIds = [...new Set((data || []).map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setMessages(
        (data || []).map((m: any) => ({ ...m, sender: map.get(m.sender_id) })),
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([fetchRooms(), fetchTeachers()]);
      setIsLoading(false);
    })();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedRoom) return;
    fetchMessages(selectedRoom.id);
    const channel = supabase
      .channel(`student-room:${selectedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .maybeSingle();
          setMessages((prev) => [...prev, { ...newMsg, sender: senderProfile as any }]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findDirectRoomWithUser = async (otherUserId: string) => {
    if (!user?.uid) return null;
    const { data: mine } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', user.uid);
    const myRoomIds = (mine || []).map((r: any) => r.room_id);
    if (!myRoomIds.length) return null;
    const { data: shared } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', otherUserId)
      .in('room_id', myRoomIds);
    const sharedIds = (shared || []).map((r: any) => r.room_id);
    if (!sharedIds.length) return null;
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', sharedIds)
      .eq('room_type', 'direct')
      .limit(1)
      .maybeSingle();
    return room as ChatRoom | null;
  };

  const openChatWithTeacher = async (teacher: TeacherContact) => {
    if (!user?.uid || !profile?.id) {
      toast.error('Profile not loaded');
      return;
    }
    try {
      let room = await findDirectRoomWithUser(teacher.user_id);
      if (!room) {
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: teacher.full_name,
            room_type: 'direct',
            created_by: profile.id,
          })
          .select()
          .single();
        if (roomError) throw roomError;
        room = newRoom as ChatRoom;

        // Add self
        const { error: selfErr } = await supabase
          .from('chat_room_members')
          .upsert(
            { room_id: room.id, user_id: user.uid },
            { onConflict: 'room_id,user_id' },
          );
        if (selfErr) throw selfErr;

        // Add teacher
        const { error: teacherErr } = await supabase
          .from('chat_room_members')
          .upsert(
            { room_id: room.id, user_id: teacher.user_id },
            { onConflict: 'room_id,user_id' },
          );
        if (teacherErr) throw teacherErr;
      }
      const directRoom: ChatRoom = {
        ...(room as ChatRoom),
        name: teacher.full_name,
        room_type: 'direct',
      };
      setRooms((prev) => (prev.some((r) => r.id === directRoom.id) ? prev : [directRoom, ...prev]));
      setSelectedRoom(directRoom);
    } catch (err: any) {
      console.error('Error opening chat:', err);
      toast.error(err?.message || 'Failed to open chat');
    }
  };

  const sendMessage = async () => {
    if (!user?.uid || !selectedRoom || !newMessage.trim()) return;
    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: selectedRoom.id,
        sender_id: user.uid,
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error(err?.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{t.title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Left panel: teachers + rooms */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.teachers}</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[520px]">
              {/* Teachers list */}
              {teachers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">{t.noTeachers}</p>
              ) : (
                <div className="space-y-1 mb-3">
                  {teachers.map((tc) => (
                    <div
                      key={tc.profile_id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={tc.avatar_url || undefined} />
                        <AvatarFallback>{tc.full_name?.[0] || 'T'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tc.full_name}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openChatWithTeacher(tc)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        {t.message}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">{t.rooms}</p>
                {rooms.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">{t.noRooms}</p>
                ) : (
                  <div className="space-y-1">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedRoom?.id === room.id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              room.room_type === 'group' ? 'bg-primary/10' : 'bg-secondary'
                            }`}
                          >
                            {room.room_type === 'group' ? (
                              <Users className="h-4 w-4 text-primary" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{room.name}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {room.room_type === 'group' ? t.groupChat : t.directMessage}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right panel: chat */}
        <Card className="md:col-span-2">
          {selectedRoom ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedRoom.room_type === 'group' ? 'bg-primary/10' : 'bg-secondary'
                    }`}
                  >
                    {selectedRoom.room_type === 'group' ? (
                      <Users className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{selectedRoom.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[520px]">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t.noMessages}</p>
                      <p className="text-sm text-muted-foreground">{t.startConversation}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[80%] ${
                              msg.sender_id === user?.uid ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.avatar_url || undefined} />
                              <AvatarFallback>{msg.sender?.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div
                              className={`rounded-lg p-3 ${
                                msg.sender_id === user?.uid
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.sender_id !== user?.uid && (
                                <p className="text-xs font-medium mb-1">{msg.sender?.full_name}</p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.sender_id === user?.uid
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {format(new Date(msg.created_at), 'p')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t.typeMessage}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t.selectRoom}</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
