import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type LiveClassStatus = 'upcoming' | 'live' | 'ended';

export interface LiveClass {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  youtube_url: string;
  youtube_video_id: string | null;
  google_meet_url: string | null;
  is_published: boolean;
  recording_url: string | null;
  recording_video_id: string | null;
  recording_available: boolean;
  created_at: string;
  updated_at: string;
  course?: { id: string; title: string; title_en: string | null };
  teacher?: { full_name: string; avatar_url: string | null } | null;
}

export interface RecordedClass {
  id: string;
  course_id: string;
  live_class_id: string | null;
  title: string;
  description: string | null;
  youtube_video_id: string;
  video_url: string;
  recorded_at: string;
}

export interface AttendanceRecord {
  id: string;
  live_class_id: string;
  user_id: string;
  course_id: string;
  join_time: string;
  status: string;
  student?: { full_name: string; email: string; avatar_url: string | null } | null;
}

export function parseYoutubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Already an id (11 chars typical)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '') || null;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      // /embed/{id} or /live/{id}
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => ['embed', 'live', 'shorts'].includes(p));
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch { /* ignore */ }
  return null;
}

export function computeStatus(lc: Pick<LiveClass, 'start_time' | 'end_time'>): LiveClassStatus {
  const now = Date.now();
  const start = new Date(lc.start_time).getTime();
  const end = new Date(lc.end_time).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'live';
}

// ============ TEACHER ============
export function useTeacherLiveClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('live_classes')
      .select('*, course:courses(id,title,title_en)')
      .eq('teacher_id', user.id)
      .order('start_time', { ascending: false });
    setClasses((data as unknown as LiveClass[]) || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('teacher-live-classes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes', filter: `teacher_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchAll]);

  const create = async (payload: Omit<LiveClass, 'id' | 'created_at' | 'updated_at' | 'teacher_id' | 'youtube_video_id' | 'recording_url' | 'recording_video_id' | 'recording_available' | 'course' | 'teacher'>) => {
    if (!user) return { error: 'Not authenticated' };
    const youtube_video_id = parseYoutubeId(payload.youtube_url);
    const { error } = await supabase.from('live_classes').insert({
      ...payload,
      teacher_id: user.id,
      youtube_video_id,
    });
    if (!error) await fetchAll();
    return { error: error?.message };
  };

  const update = async (id: string, payload: Partial<LiveClass>) => {
    const patch = { ...payload };
    if (payload.youtube_url) patch.youtube_video_id = parseYoutubeId(payload.youtube_url);
    const { error } = await supabase.from('live_classes').update(patch).eq('id', id);
    if (!error) await fetchAll();
    return { error: error?.message };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('live_classes').delete().eq('id', id);
    if (!error) await fetchAll();
    return { error: error?.message };
  };

  return { classes, isLoading, refetch: fetchAll, create, update, remove };
}

// ============ STUDENT ============
export function useStudentLiveClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    // RLS restricts to enrolled + published
    const { data: lcData } = await supabase
      .from('live_classes')
      .select('*, course:courses(id,title,title_en)')
      .order('start_time', { ascending: false });

    const list = (lcData as unknown as LiveClass[]) || [];
    // Enrich with teacher profile
    const teacherIds = Array.from(new Set(list.map(l => l.teacher_id)));
    if (teacherIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', teacherIds);
      const map = new Map<string, { user_id: string; full_name: string; avatar_url: string | null }>((profs || []).map((p: any) => [p.user_id, p]));
      list.forEach(l => {
        const p = map.get(l.teacher_id);
        l.teacher = p ? { full_name: p.full_name, avatar_url: p.avatar_url } : null;
      });
    }
    setClasses(list);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('student-live-classes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchAll]);

  const recordAttendance = async (lc: LiveClass) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase.from('live_class_attendance').upsert(
      {
        live_class_id: lc.id,
        user_id: user.id,
        course_id: lc.course_id,
        status: 'joined',
        join_time: new Date().toISOString(),
      },
      { onConflict: 'live_class_id,user_id', ignoreDuplicates: true }
    );
    return { error: error?.message };
  };

  return { classes, isLoading, refetch: fetchAll, recordAttendance };
}

// ============ ATTENDANCE (teacher view) ============
export function useLiveClassAttendance(liveClassId: string | null) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!liveClassId) { setRecords([]); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from('live_class_attendance')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('join_time', { ascending: true });
    const list = (data as unknown as AttendanceRecord[]) || [];
    const userIds = Array.from(new Set(list.map(r => r.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);
      const map = new Map<string, { user_id: string; full_name: string; email: string; avatar_url: string | null }>((profs || []).map((p: any) => [p.user_id, p]));
      list.forEach(r => {
        const p = map.get(r.user_id);
        r.student = p ? { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url } : null;
      });
    }
    setRecords(list);
    setIsLoading(false);
  }, [liveClassId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { records, isLoading, refetch: fetchAll };
}

// ============ RECORDED ============
export function useRecordedClasses(courseId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordedClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    let q = supabase.from('recorded_classes').select('*').order('recorded_at', { ascending: false });
    if (courseId) q = q.eq('course_id', courseId);
    const { data } = await q;
    setRecords((data as RecordedClass[]) || []);
    setIsLoading(false);
  }, [user, courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('recorded-classes-' + (courseId || 'all'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recorded_classes' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, courseId, fetchAll]);

  // Auto-promote ended classes with youtube_video_id → recorded_classes (client-side, dedup by video id)
  const autoPromoteEnded = useCallback(async (endedClasses: LiveClass[]) => {
    if (!endedClasses.length) return;
    const existingIds = new Set(records.map(r => r.youtube_video_id));
    const toInsert = endedClasses
      .filter(lc => lc.youtube_video_id && !existingIds.has(lc.youtube_video_id))
      .map(lc => ({
        course_id: lc.course_id,
        live_class_id: lc.id,
        title: lc.title,
        description: lc.description,
        youtube_video_id: lc.youtube_video_id!,
        video_url: `https://www.youtube.com/watch?v=${lc.youtube_video_id}`,
        recorded_at: lc.end_time,
      }));
    if (toInsert.length) {
      await supabase.from('recorded_classes').upsert(toInsert, { onConflict: 'live_class_id', ignoreDuplicates: true });
      await fetchAll();
    }
  }, [records, fetchAll]);

  return { records, isLoading, refetch: fetchAll, autoPromoteEnded };
}
