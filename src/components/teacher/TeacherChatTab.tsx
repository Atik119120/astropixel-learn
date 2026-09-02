import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Plus, Send, Users, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TeacherChatTabProps {
  courses: any[];
  language: 'en' | 'bn';
}

interface ChatRoom {
  id: string;
  name: string;
  room_type: 'group' | 'direct';
  course_id: string | null;
  created_at: string;
  last_message?: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface StudentContact {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

const translations = {
  en: {
    title: 'Messages',
    createRoom: 'New Chat Room',
    roomName: 'Room Name',
    roomType: 'Room Type',
    groupChat: 'Group Chat',
    directMessage: 'Direct Message',
    selectCourse: 'Select Course (Optional)',
    create: 'Create',
    cancel: 'Cancel',
    typeMessage: 'Type a message...',
    send: 'Send',
    noRooms: 'No chat rooms yet',
    createFirst: 'Create a chat room to start messaging with students',
    noMessages: 'No messages yet',
    startConversation: 'Start the conversation!',
    selectStudent: 'Select Student',
    students: 'Students',
    noStudents: 'No students yet',
  },
  bn: {
    title: 'মেসেজ',
    createRoom: 'নতুন চ্যাট রুম',
    roomName: 'রুমের নাম',
    roomType: 'রুমের ধরন',
    groupChat: 'গ্রুপ চ্যাট',
    directMessage: 'ডাইরেক্ট মেসেজ',
    selectCourse: 'কোর্স নির্বাচন করুন (ঐচ্ছিক)',
    create: 'তৈরি করুন',
    cancel: 'বাতিল',
    typeMessage: 'মেসেজ লিখুন...',
    send: 'পাঠান',
    noRooms: 'কোনো চ্যাট রুম নেই',
    createFirst: 'স্টুডেন্টদের সাথে মেসেজ করতে চ্যাট রুম তৈরি করুন',
    noMessages: 'কোনো মেসেজ নেই',
    startConversation: 'কথোপকথন শুরু করুন!',
    selectStudent: 'স্টুডেন্ট নির্বাচন করুন',
    students: 'স্টুডেন্টরা',
    noStudents: 'এখনও কোনো স্টুডেন্ট নেই',
  },
};

export default function TeacherChatTab({ courses, language }: TeacherChatTabProps) {
  const { user, profile } = useAuth();
  const t = translations[language];
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [students, setStudents] = useState<StudentContact[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    roomType: 'group' as 'group' | 'direct',
    courseId: '',
    studentId: '',
  });

  const fetchRooms = async () => {
    if (!user?.uid) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      const typedRooms = (data || []).map(room => ({
        ...room,
        room_type: room.room_type as 'group' | 'direct'
      }));
      setRooms(typedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setIsLoading(false);
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
      
      // Fetch sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const messagesWithSenders = data?.map(m => ({
        ...m,
        sender: profileMap.get(m.sender_id),
      })) || [];
      
      setMessages(messagesWithSenders);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchStudents = async () => {
    if (!profile?.id || !user?.uid) return;

    try {
      // 1. Owner courses (courses.teacher_id = my profile id)
      const { data: ownerCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', profile.id);
      const ownerCourseIds = (ownerCourses || []).map((c: any) => c.id);

      // 2. Co-instructor courses (course_instructors -> team_members -> my linked profile)
      let coCourseIds: string[] = [];
      if (profile.linked_team_member_id) {
        const { data: ciRows } = await supabase
          .from('course_instructors')
          .select('course_id')
          .eq('instructor_id', profile.linked_team_member_id);
        coCourseIds = (ciRows || []).map((r: any) => r.course_id);
      }

      const courseIds = [...new Set([...ownerCourseIds, ...coCourseIds])];
      if (courseIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: enrollments, error } = await supabase
        .from('student_courses')
        .select('user_id')
        .eq('is_active', true)
        .in('course_id', courseIds);

      if (error) throw error;

      const studentUserIds = [...new Set((enrollments || []).map((row) => row.user_id))].filter(
        (id) => id && id !== user.uid,
      );

      if (studentUserIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: studentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('user_id', studentUserIds)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      setStudents((studentProfiles || []) as StudentContact[]);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, [user?.uid, profile?.id]);

  const findDirectRoomWithStudent = async (studentUserId: string) => {
    if (!user?.uid) return null;

    const { data: myMemberships, error: myMembershipsError } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', user.uid);
    if (myMembershipsError) throw myMembershipsError;

    const myRoomIds = (myMemberships || []).map((membership) => membership.room_id);
    if (!myRoomIds.length) return null;

    const { data: sharedMemberships, error: sharedMembershipsError } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', studentUserId)
      .in('room_id', myRoomIds);
    if (sharedMembershipsError) throw sharedMembershipsError;

    const sharedRoomIds = (sharedMemberships || []).map((membership) => membership.room_id);
    if (!sharedRoomIds.length) return null;

    const { data: directRoom, error: directRoomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', sharedRoomIds)
      .eq('room_type', 'direct')
      .limit(1)
      .maybeSingle();
    if (directRoomError) throw directRoomError;

    return directRoom;
  };

  const openDirectChat = async (student: StudentContact) => {
    if (!user?.uid || !profile?.id) {
      toast.error('Profile not loaded');
      return;
    }

    try {
      let room = await findDirectRoomWithStudent(student.user_id);

      if (!room) {
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: student.full_name,
            room_type: 'direct',
            created_by: profile.id,
          })
          .select()
          .single();
        if (roomError) throw roomError;
        room = newRoom;

        const { error: selfError } = await supabase
          .from('chat_room_members')
          .upsert({ room_id: room.id, user_id: user.uid }, { onConflict: 'room_id,user_id' });
        if (selfError) throw selfError;

        const { error: studentError } = await supabase
          .from('chat_room_members')
          .upsert({ room_id: room.id, user_id: student.user_id }, { onConflict: 'room_id,user_id' });
        if (studentError) throw studentError;
      }

      const directRoom = { ...room, name: student.full_name, room_type: 'direct' as const };
      setSelectedRoom(directRoom);
      setRooms((currentRooms) => currentRooms.some((item) => item.id === directRoom.id) ? currentRooms : [directRoom, ...currentRooms]);
    } catch (err) {
      console.error('Error opening direct chat:', err);
      toast.error('Failed to open chat');
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`room:${selectedRoom.id}`)
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
            
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .eq('user_id', newMsg.sender_id)
              .single();
            
            setMessages(prev => [...prev, { ...newMsg, sender: senderProfile ?? undefined }]);
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedRoom?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createRoom = async () => {
    if (!profile?.id) return;

    const selectedStudent = students.find(s => s.id === formData.studentId);
    const roomName = formData.name.trim() || (formData.roomType === 'direct' ? selectedStudent?.full_name : '');

    if (!roomName) {
      toast.error(formData.roomType === 'direct' ? 'Please select a student' : 'Please enter a room name');
      return;
    }
    
    try {
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName,
          room_type: formData.roomType,
          course_id: formData.courseId || null,
          created_by: profile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add teacher as member
      const { error: teacherMemberError } = await supabase
        .from('chat_room_members')
        .upsert({
          room_id: room.id,
          user_id: user?.uid,
        }, { onConflict: 'room_id,user_id' });
      if (teacherMemberError) throw teacherMemberError;
      
      // If direct message, add the student
      if (formData.roomType === 'direct' && formData.studentId) {
        if (selectedStudent) {
          const { error: studentMemberError } = await supabase
            .from('chat_room_members')
            .upsert({
              room_id: room.id,
              user_id: selectedStudent.user_id,
            }, { onConflict: 'room_id,user_id' });
          if (studentMemberError) throw studentMemberError;
        }
      }
      
      // If group chat for a course, add all students of that course
      if (formData.roomType === 'group' && formData.courseId) {
        const { data: courseStudents } = await supabase
          .from('student_courses')
          .select('user_id')
          .eq('course_id', formData.courseId)
          .eq('is_active', true);
        
        const memberInserts = courseStudents?.map(cs => ({
          room_id: room.id,
          user_id: cs.user_id,
        })).filter(m => m.user_id) || [];
        
        if (memberInserts.length > 0) {
          const { error: membersError } = await supabase
            .from('chat_room_members')
            .upsert(memberInserts, { onConflict: 'room_id,user_id' });
          if (membersError) throw membersError;
        }
      }
      
      toast.success('Chat room created');
      setIsDialogOpen(false);
      setFormData({ name: '', roomType: 'group', courseId: '', studentId: '' });
      fetchRooms();
    } catch (err) {
      console.error('Error creating room:', err);
      toast.error('Failed to create chat room');
    }
  };

  const sendMessage = async () => {
    if (!user?.uid || !selectedRoom || !newMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.uid,
          message: newMessage.trim(),
        });
      
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          {t.title}
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.createRoom}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.createRoom}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t.roomName}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.roomName}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t.roomType}</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value: 'group' | 'direct') => 
                    setFormData({ ...formData, roomType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t.groupChat}
                      </div>
                    </SelectItem>
                    <SelectItem value="direct">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t.directMessage}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.roomType === 'group' && (
                <div className="space-y-2">
                  <Label>{t.selectCourse}</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectCourse} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {formData.roomType === 'direct' && (
                <div className="space-y-2">
                  <Label>{t.selectStudent}</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectStudent} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={createRoom}>
                  {t.create}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Room List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.students}</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[520px]">
              {students.length === 0 && rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">{t.noStudents}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => openDirectChat(student)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedRoom?.name === student.full_name && selectedRoom?.room_type === 'direct'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar_url || undefined} />
                          <AvatarFallback>{student.full_name?.[0] || 'S'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words leading-snug">{student.full_name}</p>
                          <Badge variant="outline" className="mt-1 text-xs">{t.directMessage}</Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                  {rooms.filter((room) => room.room_type === 'group').map((room) => (
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          room.room_type === 'group' ? 'bg-primary/10' : 'bg-secondary'
                        }`}>
                          {room.room_type === 'group' ? (
                            <Users className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{room.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {room.room_type === 'group' ? t.groupChat : t.directMessage}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedRoom ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedRoom.room_type === 'group' ? 'bg-primary/10' : 'bg-secondary'
                  }`}>
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
                          <div className={`flex gap-2 max-w-[80%] ${
                            msg.sender_id === user?.uid ? 'flex-row-reverse' : ''
                          }`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.avatar_url || undefined} />
                              <AvatarFallback>
                                {msg.sender?.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`rounded-lg p-3 ${
                              msg.sender_id === user?.uid
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}>
                              {msg.sender_id !== user?.uid && (
                                <p className="text-xs font-medium mb-1">
                                  {msg.sender?.full_name}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.sender_id === user?.uid
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}>
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
              <p className="text-muted-foreground">{t.createFirst}</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
