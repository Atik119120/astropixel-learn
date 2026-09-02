import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props { language: 'en' | 'bn' }

interface TeacherContact {
  user_id: string;
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  courses: string[];
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

const T = {
  en: {
    title: 'Support Chat', subtitle: 'Chat with your course teachers',
    noTeachers: 'No teachers yet', hint: 'Buy a course and its teacher will appear here.',
    placeholder: 'Type a message...', select: 'Select a teacher to start chatting',
    online: 'Instructor', search: 'Search teachers...',
  },
  bn: {
    title: 'সাপোর্ট চ্যাট', subtitle: 'আপনার কোর্স টিচারদের সাথে চ্যাট করুন',
    noTeachers: 'এখনও কোনো টিচার নেই', hint: 'কোর্স কিনলে সেই টিচার এখানে দেখা যাবে।',
    placeholder: 'মেসেজ লিখুন...', select: 'চ্যাট শুরু করতে টিচার নির্বাচন করুন',
    online: 'ইন্সট্রাক্টর', search: 'টিচার খুঁজুন...',
  },
};

export default function StudentSupportChat({ language }: Props) {
  const { user, profile } = useAuth();
  const t = T[language];

  const [teachers, setTeachers] = useState<TeacherContact[]>([]);
  const [selected, setSelected] = useState<TeacherContact | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Fetch teachers of enrolled courses
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoading(true);
      const { data: enrolls } = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('user_id', user.uid)
        .eq('is_active', true);
      const courseIds = enrolls?.map(e => e.course_id) || [];
      if (!courseIds.length) { setTeachers([]); setLoading(false); return; }

      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, teacher_id')
        .in('id', courseIds);
      const teacherProfileIds = [...new Set((courses || []).map(c => c.teacher_id).filter(Boolean))] as string[];
      if (!teacherProfileIds.length) { setTeachers([]); setLoading(false); return; }

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('id', teacherProfileIds);

      const map = new Map<string, TeacherContact>();
      (profs || []).forEach(p => {
        map.set(p.id, {
          profile_id: p.id, user_id: p.user_id,
          full_name: p.full_name, avatar_url: p.avatar_url,
          courses: [],
        });
      });
      (courses || []).forEach(c => {
        const tt = map.get(c.teacher_id as string);
        if (tt) tt.courses.push(c.title);
      });
      setTeachers(Array.from(map.values()));
      setLoading(false);
    })();
  }, [user?.uid]);

  // Find or create direct room with a teacher
  const openChat = async (teacher: TeacherContact) => {
    if (!user?.uid || !profile?.id) {
      toast.error('Profile not loaded');
      return;
    }
    setSelected(teacher);
    setMessages([]);
    setRoomId(null);

    // Rooms I'm a member of
    const { data: myMemberships, error: mmErr } = await supabase
      .from('chat_room_members').select('room_id').eq('user_id', user.uid);
    if (mmErr) console.error('memberships err', mmErr);
    const myRoomIds = (myMemberships || []).map(m => m.room_id);

    let existingId: string | null = null;
    if (myRoomIds.length) {
      const { data: shared } = await supabase
        .from('chat_room_members').select('room_id')
        .eq('user_id', teacher.user_id).in('room_id', myRoomIds);
      const candidates = (shared || []).map(s => s.room_id);
      if (candidates.length) {
        const { data: directs } = await supabase
          .from('chat_rooms').select('id').in('id', candidates).eq('room_type', 'direct');
        if (directs && directs.length) existingId = directs[0].id;
      }
    }

    if (existingId) {
      setRoomId(existingId);
      return;
    }

    // Create new
    const { data: newRoom, error: cErr } = await supabase
      .from('chat_rooms').insert({
        name: teacher.full_name,
        room_type: 'direct',
        created_by: profile.id,
      }).select().single();
    if (cErr || !newRoom) {
      console.error('create room error', cErr);
      toast.error('Could not open chat: ' + (cErr?.message || 'unknown'));
      return;
    }

    // Add self first
    const { error: m1 } = await supabase.from('chat_room_members').upsert({
      room_id: newRoom.id, user_id: user.uid,
    }, { onConflict: 'room_id,user_id' });
    if (m1) {
      console.error('add self err', m1);
      toast.error('Could not open chat: ' + m1.message);
      return;
    }

    // Add teacher
    const { error: m2 } = await supabase.from('chat_room_members').upsert({
      room_id: newRoom.id, user_id: teacher.user_id,
    }, { onConflict: 'room_id,user_id' });
    if (m2) {
      console.error('add teacher err', m2);
      toast.error('Could not add teacher: ' + m2.message);
      return;
    }

    setRoomId(newRoom.id);
  };

  // Load messages + realtime
  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const { data } = await supabase
        .from('chat_messages').select('*')
        .eq('room_id', roomId).order('created_at', { ascending: true });
      setMessages((data || []) as ChatMessage[]);
    })();

    const channel = supabase
      .channel(`support:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => setMessages(prev => [...prev, payload.new as ChatMessage]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!user?.uid) return;
    if (!roomId) { toast.error('Chat not ready, click the teacher again'); return; }
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId, sender_id: user.uid, message: msg,
    });
    if (error) {
      console.error('send err', error);
      toast.error('Failed to send: ' + error.message);
    }
  };


  const filtered = teachers.filter(tt => tt.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{t.title}</h2>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[600px]">
        {/* Teacher list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-lg shadow-black/5 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} className="h-8 pl-8 text-xs" />
            </div>
          </div>
          <ScrollArea className="flex-1 w-full [&>[data-radix-scroll-area-viewport]>div]:!block">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">{t.noTeachers}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{t.hint}</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filtered.map(tt => (
                  <button key={tt.profile_id} onClick={() => openChat(tt)}
                    className={`w-full min-w-0 overflow-hidden flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      selected?.profile_id === tt.profile_id
                        ? 'bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20'
                        : 'hover:bg-secondary/70'
                    }`}>
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        <AvatarImage src={tt.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-600 text-white text-xs font-bold">
                          {tt.full_name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{tt.full_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {tt.courses.slice(0, 2).join(', ')}
                        {tt.courses.length > 2 ? ` +${tt.courses.length - 2}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat window */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-lg shadow-black/5 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="p-3 border-b border-border/50 flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={selected.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-600 text-white text-xs font-bold">
                    {selected.full_name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{selected.full_name}</p>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {t.online}
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-slate-50/60 dark:bg-slate-950/40">
                <div className="space-y-2">
                  {messages.map(m => {
                    const mine = m.sender_id === user?.uid;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                          mine
                            ? 'bg-gradient-to-br from-primary to-cyan-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-slate-800 border border-border/50 rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                          <p className={`text-[9px] mt-0.5 ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {format(new Date(m.created_at), 'p')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-border/50 flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={t.placeholder} className="flex-1 h-10 rounded-full" />
                <Button onClick={send} disabled={!input.trim()} size="icon" className="h-10 w-10 rounded-full">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-500/10 flex items-center justify-center mb-3">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium">{t.select}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
