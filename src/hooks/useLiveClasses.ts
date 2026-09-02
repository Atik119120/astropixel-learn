import { useCallback, useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, setDoc, deleteDoc, orderBy, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
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
    const q = query(collection(db, 'live_classes'), where('teacher_id', '==', user.uid), orderBy('start_time', 'desc'));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    const courseIds = [...new Set(list.map(l => l.course_id))];
    const coursesMap = new Map();
    if (courseIds.length > 0) {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      coursesSnap.docs.forEach(c => {
        coursesMap.set(c.id, { id: c.id, ...c.data() });
      });
    }

    list.forEach(l => {
      const c = coursesMap.get(l.course_id);
      if (c) l.course = { id: c.id, title: c.title, title_en: c.title_en };
    });

    setClasses(list as LiveClass[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'live_classes'), where('teacher_id', '==', user.uid));
    const unsub = onSnapshot(q, () => fetchAll());
    return () => unsub();
  }, [user, fetchAll]);

  const create = async (payload: Omit<LiveClass, 'id' | 'created_at' | 'updated_at' | 'teacher_id' | 'youtube_video_id' | 'recording_url' | 'recording_video_id' | 'recording_available' | 'course' | 'teacher'>) => {
    if (!user) return { error: 'Not authenticated' };
    const youtube_video_id = parseYoutubeId(payload.youtube_url);
    try {
      await addDoc(collection(db, 'live_classes'), {
        ...payload,
        teacher_id: user.uid,
        youtube_video_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await fetchAll();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const update = async (id: string, payload: Partial<LiveClass>) => {
    const patch = { ...payload, updated_at: new Date().toISOString() };
    if (payload.youtube_url) patch.youtube_video_id = parseYoutubeId(payload.youtube_url);
    try {
      await updateDoc(doc(db, 'live_classes', id), patch);
      await fetchAll();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'live_classes', id));
      await fetchAll();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
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
    const q = query(collection(db, 'live_classes'), orderBy('start_time', 'desc'));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    // Enrich with courses
    const courseIds = [...new Set(list.map(l => l.course_id))];
    const coursesMap = new Map();
    if (courseIds.length > 0) {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      coursesSnap.docs.forEach(c => {
        coursesMap.set(c.id, { id: c.id, ...c.data() });
      });
    }
    list.forEach(l => {
      const c = coursesMap.get(l.course_id);
      if (c) l.course = { id: c.id, title: c.title, title_en: c.title_en };
    });

    // Enrich with teacher profile
    const teacherIds = Array.from(new Set(list.map(l => l.teacher_id)));
    if (teacherIds.length) {
      const profsSnap = await getDocs(collection(db, 'profiles'));
      const profs = profsSnap.docs.map(d => ({ user_id: d.id, ...d.data() })).filter((p: any) => teacherIds.includes(p.user_id));
      const map = new Map<string, any>(profs.map((p: any) => [p.user_id, p]));
      list.forEach(l => {
        const p = map.get(l.teacher_id);
        l.teacher = p ? { full_name: p.full_name, avatar_url: p.avatar_url } : null;
      });
    }
    setClasses(list as LiveClass[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'live_classes'), () => fetchAll());
    return () => unsub();
  }, [user, fetchAll]);

  const recordAttendance = async (lc: LiveClass) => {
    if (!user) return { error: 'Not authenticated' };
    const attendanceId = `${lc.id}_${user.uid}`;
    try {
      await setDoc(doc(db, 'live_class_attendance', attendanceId), {
        live_class_id: lc.id,
        user_id: user.uid,
        course_id: lc.course_id,
        status: 'joined',
        join_time: new Date().toISOString(),
      }, { merge: true });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
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
    const q = query(collection(db, 'live_class_attendance'), where('live_class_id', '==', liveClassId), orderBy('join_time', 'asc'));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const userIds = Array.from(new Set(list.map(r => r.user_id)));
    if (userIds.length) {
      const profsSnap = await getDocs(collection(db, 'profiles'));
      const profs = profsSnap.docs.map(d => ({ user_id: d.id, ...d.data() })).filter((p: any) => userIds.includes(p.user_id));
      const map = new Map<string, any>(profs.map((p: any) => [p.user_id, p]));
      list.forEach(r => {
        const p = map.get(r.user_id);
        r.student = p ? { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url } : null;
      });
    }
    setRecords(list as AttendanceRecord[]);
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
    let q = query(collection(db, 'recorded_classes'), orderBy('recorded_at', 'desc'));
    if (courseId) {
      q = query(collection(db, 'recorded_classes'), where('course_id', '==', courseId), orderBy('recorded_at', 'desc'));
    }
    const snap = await getDocs(q);
    setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RecordedClass[]);
    setIsLoading(false);
  }, [user, courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    let q = query(collection(db, 'recorded_classes'));
    const unsub = onSnapshot(q, () => fetchAll());
    return () => unsub();
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
      for (const item of toInsert) {
        const id = item.live_class_id;
        await setDoc(doc(db, 'recorded_classes', id), item, { merge: true });
      }
      await fetchAll();
    }
  }, [records, fetchAll]);

  return { records, isLoading, refetch: fetchAll, autoPromoteEnded };
}
