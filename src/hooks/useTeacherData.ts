import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherStats, TeacherCourse, RevenueRecord, PaidWork, StudentProgress, SupportTicket, WithdrawalRequest } from '@/types/teacher';

export function useTeacherStats() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      // Fetch teacher's courses
      const qCourses = query(collection(db, 'courses'), where('teacher_id', '==', profile.id));
      const coursesSnap = await getDocs(qCourses);
      const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // Fetch revenue records
      const qRevenue = query(collection(db, 'revenue_records'), where('teacher_id', '==', profile.id), where('status', '==', 'approved'));
      const revenueSnap = await getDocs(qRevenue);
      const revenue = revenueSnap.docs.map(d => d.data()) as any[];

      // Fetch withdrawal requests
      const qWithdrawals = query(collection(db, 'withdrawal_requests'), where('teacher_id', '==', profile.id));
      const withdrawalsSnap = await getDocs(qWithdrawals);
      const withdrawals = withdrawalsSnap.docs.map(d => d.data()) as any[];

      // Fetch enrolled students count for teacher's courses
      const courseIds = courses?.map(c => c.id) || [];
      let totalStudents = 0;

      if (courseIds.length > 0) {
        for (let i = 0; i < courseIds.length; i += 10) {
          const chunk = courseIds.slice(i, i + 10);
          const qStudents = query(collection(db, 'student_courses'), where('course_id', 'in', chunk), where('is_active', '==', true));
          const studentsSnap = await getDocs(qStudents);
          totalStudents += studentsSnap.size;
        }
      }

      // Calculate stats
      const recordedCourses = courses?.filter(c => c.course_type === 'recorded').length || 0;
      const liveCourses = courses?.filter(c => c.course_type === 'live').length || 0;
      const freeCourses = courses?.filter(c => c.course_type === 'free').length || 0;

      const recordedEarnings = revenue
        ?.filter(r => r.revenue_type === 'recorded_course')
        .reduce((sum, r) => sum + (r.teacher_share || 0), 0) || 0;

      const liveEarnings = revenue
        ?.filter(r => r.revenue_type === 'live_class')
        .reduce((sum, r) => sum + (r.teacher_share || 0), 0) || 0;

      const paidWorkEarnings = revenue
        ?.filter(r => r.revenue_type === 'paid_work')
        .reduce((sum, r) => sum + (r.teacher_share || 0), 0) || 0;

      const totalEarnings = recordedEarnings + liveEarnings + paidWorkEarnings;

      const paidWithdrawals = withdrawals
        ?.filter(w => w.status === 'paid')
        .reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      const pendingWithdrawal = withdrawals
        ?.filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      const availableBalance = totalEarnings - paidWithdrawals - pendingWithdrawal;

      setStats({
        totalCourses: courses?.length || 0,
        recordedCourses,
        liveCourses,
        freeCourses,
        totalStudents,
        recordedEarnings,
        liveEarnings,
        paidWorkEarnings,
        totalEarnings,
        pendingWithdrawal,
        availableBalance,
      });
    } catch (err) {
      console.error('Error fetching teacher stats:', err);
      setError('Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useTeacherCourses() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      // Also include courses where this teacher is a co-instructor (course_instructors)
      let coInstructorCourseIds: string[] = [];
      if (profile.linked_team_member_id) {
        const qCi = query(collection(db, 'course_instructors'), where('instructor_id', '==', profile.linked_team_member_id));
        const ciSnap = await getDocs(qCi);
        coInstructorCourseIds = ciSnap.docs.map(d => d.data().course_id);
      }

      const qCourses = query(collection(db, 'courses'), orderBy('created_at', 'desc'));
      const coursesSnap = await getDocs(qCourses);
      const allCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const data = allCourses.filter(c => c.teacher_id === profile.id || coInstructorCourseIds.includes(c.id));

      // Get enrolled students count for each course
      const coursesWithStats = await Promise.all(
        data.map(async (course) => {
          const qStudents = query(collection(db, 'student_courses'), where('course_id', '==', course.id), where('is_active', '==', true));
          const snapStudents = await getDocs(qStudents);
          const count = snapStudents.size;

          const qRevenue = query(collection(db, 'revenue_records'), where('course_id', '==', course.id), where('teacher_id', '==', profile.id), where('status', '==', 'approved'));
          const snapRevenue = await getDocs(qRevenue);
          const totalRevenue = snapRevenue.docs.reduce((sum, r) => sum + (r.data().teacher_share || 0), 0);

          return {
            ...course,
            course_type: course.course_type || 'recorded',
            is_approved: course.is_approved || false,
            enrolled_students: count || 0,
            total_revenue: totalRevenue,
          } as TeacherCourse;
        })
      );

      setCourses(coursesWithStats);
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
      setError('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, isLoading, error, refetch: fetchCourses };
}

export function useTeacherStudents() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      // Get teacher's course IDs
      const qCourses = query(collection(db, 'courses'), where('teacher_id', '==', profile.id));
      const coursesSnap = await getDocs(qCourses);
      const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (!courses || courses.length === 0) {
        setStudents([]);
        return;
      }

      const courseIds = courses.map(c => c.id);

      // Get student course assignments
      let studentAssignments: any[] = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        const chunk = courseIds.slice(i, i + 10);
        const qAssignments = query(collection(db, 'student_courses'), where('course_id', 'in', chunk), where('is_active', '==', true));
        const assignSnap = await getDocs(qAssignments);
        studentAssignments = studentAssignments.concat(assignSnap.docs.map(d => d.data()));
      }

      if (!studentAssignments || studentAssignments.length === 0) {
        setStudents([]);
        return;
      }

      // Get unique student user_ids
      const studentUserIds = [...new Set(studentAssignments.map(sa => sa.user_id))];

      // Fetch profiles for these students
      let studentProfiles: any[] = [];
      for (let i = 0; i < studentUserIds.length; i += 10) {
        const chunk = studentUserIds.slice(i, i + 10);
        // Assuming profiles has user_id field
        const qProfiles = query(collection(db, 'profiles'), where('user_id', 'in', chunk));
        const profSnap = await getDocs(qProfiles);
        studentProfiles = studentProfiles.concat(profSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      if (!studentProfiles.length) {
        setStudents([]);
        return;
      }

      // Build student progress list
      const studentProgressList: StudentProgress[] = [];

      for (const sa of studentAssignments) {
        const student = studentProfiles.find(p => p.user_id === sa.user_id);
        if (!student) continue;

        const course = courses.find(c => c.id === sa.course_id);
        if (!course) continue;

        // Get video count for course
        const qVideos = query(collection(db, 'videos'), where('course_id', '==', sa.course_id));
        const videosSnap = await getDocs(qVideos);
        const totalVideos = videosSnap.size;
        const videoIds = videosSnap.docs.map(d => d.id);

        let completedVideos = 0;
        let lastWatched = null;

        if (videoIds.length > 0) {
           const qProg = query(collection(db, 'video_progress'), where('user_id', '==', student.user_id));
           const progSnap = await getDocs(qProg);
           const progress = progSnap.docs.map(d => d.data()).filter(p => videoIds.includes(p.video_id));
           
           completedVideos = progress.filter(p => p.is_completed).length;
           lastWatched = progress.sort((a, b) => 
             new Date(b.last_watched_at || 0).getTime() - new Date(a.last_watched_at || 0).getTime()
           )[0]?.last_watched_at || null;
        }

        const progressPercent = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;

        studentProgressList.push({
          student,
          course: course as any,
          progress_percent: progressPercent,
          last_watched_at: lastWatched,
          is_completed: progressPercent === 100,
          videos_completed: completedVideos,
          total_videos: totalVideos || 0,
        });
      }

      setStudents(studentProgressList);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, isLoading, error, refetch: fetchStudents };
}

export function useTeacherRevenue() {
  const { user, profile } = useAuth();
  const [revenue, setRevenue] = useState<RevenueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      const qRev = query(collection(db, 'revenue_records'), where('teacher_id', '==', profile.id), orderBy('created_at', 'desc'));
      const revSnap = await getDocs(qRev);
      const revRecords = revSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // Fetch related courses and students
      const courseIds = [...new Set(revRecords.map(r => r.course_id).filter(Boolean))];
      const studentIds = [...new Set(revRecords.map(r => r.student_id).filter(Boolean))];

      const coursesMap = new Map();
      if (courseIds.length) {
         for(let i=0; i<courseIds.length; i+=10) {
           const chunk = courseIds.slice(i, i+10);
           // In Firestore querying by document ID usually uses documentId() but here id might be stored
           // Assuming we just fetch all courses since we already mapped courses previously in other hooks
           const qC = query(collection(db, 'courses'));
           const snap = await getDocs(qC);
           snap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() }));
         }
      }

      const studentsMap = new Map();
      if (studentIds.length) {
         for(let i=0; i<studentIds.length; i+=10) {
           const chunk = studentIds.slice(i, i+10);
           const qS = query(collection(db, 'profiles'), where('user_id', 'in', chunk));
           const snap = await getDocs(qS);
           snap.docs.forEach(d => studentsMap.set(d.data().user_id, { id: d.id, ...d.data() }));
         }
      }

      revRecords.forEach(r => {
         if (r.course_id) r.course = coursesMap.get(r.course_id);
         if (r.student_id) r.student = studentsMap.get(r.student_id);
      });

      setRevenue(revRecords as RevenueRecord[]);
    } catch (err) {
      console.error('Error fetching revenue:', err);
      setError('Failed to fetch revenue');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { revenue, isLoading, error, refetch: fetchRevenue };
}

export function useTeacherPaidWorks() {
  const { user, profile } = useAuth();
  const [works, setWorks] = useState<PaidWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      const qWorks = query(collection(db, 'paid_works'), where('assigned_to', '==', profile.id), orderBy('created_at', 'desc'));
      const worksSnap = await getDocs(qWorks);
      setWorks(worksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PaidWork[]);
    } catch (err) {
      console.error('Error fetching paid works:', err);
      setError('Failed to fetch paid works');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const updateWorkStatus = async (workId: string, status: PaidWork['status']) => {
    try {
      const updates: Partial<PaidWork> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      await updateDoc(doc(db, 'paid_works', workId), updates);
      await fetchWorks();
      return { error: null };
    } catch (err: any) {
      console.error('Error updating work status:', err);
      return { error: err.message };
    }
  };

  return { works, isLoading, error, refetch: fetchWorks, updateWorkStatus };
}

export function useTeacherTickets() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      const qTickets = query(collection(db, 'support_tickets'), where('teacher_id', '==', profile.id), orderBy('created_at', 'desc'));
      const ticketsSnap = await getDocs(qTickets);
      const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      const studentIds = [...new Set(tickets.map(t => t.student_id).filter(Boolean))];
      const courseIds = [...new Set(tickets.map(t => t.course_id).filter(Boolean))];

      const studentsMap = new Map();
      if (studentIds.length) {
         for(let i=0; i<studentIds.length; i+=10) {
           const chunk = studentIds.slice(i, i+10);
           const qS = query(collection(db, 'profiles'), where('user_id', 'in', chunk));
           const snap = await getDocs(qS);
           snap.docs.forEach(d => studentsMap.set(d.data().user_id, { id: d.id, ...d.data() }));
         }
      }

      const coursesMap = new Map();
      if (courseIds.length) {
         const qC = query(collection(db, 'courses'));
         const snap = await getDocs(qC);
         snap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() }));
      }

      tickets.forEach(t => {
         if (t.student_id) t.student = studentsMap.get(t.student_id);
         if (t.course_id) t.course = coursesMap.get(t.course_id);
      });

      setTickets(tickets as SupportTicket[]);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { status });
      await fetchTickets();
      return { error: null };
    } catch (err: any) {
      console.error('Error updating ticket status:', err);
      return { error: err.message };
    }
  };

  const sendMessage = async (ticketId: string, message: string) => {
    if (!profile) return { error: 'No profile' };
    try {
      await addDoc(collection(db, 'ticket_messages'), {
        ticket_id: ticketId,
        sender_id: profile.id,
        message,
        created_at: new Date().toISOString()
      });
      return { error: null };
    } catch (err: any) {
      console.error('Error sending message:', err);
      return { error: err.message };
    }
  };

  return { tickets, isLoading, error, refetch: fetchTickets, updateTicketStatus, sendMessage };
}

export function useWithdrawals() {
  const { user, profile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      const qW = query(collection(db, 'withdrawal_requests'), where('teacher_id', '==', profile.id), orderBy('created_at', 'desc'));
      const snap = await getDocs(qW);
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })) as WithdrawalRequest[]);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError('Failed to fetch withdrawals');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const createWithdrawal = async (
    amount: number, 
    paymentMethod: 'bkash' | 'nagad' | 'bank',
    paymentDetails: Record<string, any>
  ) => {
    if (!profile) return { error: 'No profile' };

    try {
      await addDoc(collection(db, 'withdrawal_requests'), {
        teacher_id: profile.id,
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      await fetchWithdrawals();
      return { error: null };
    } catch (err: any) {
      console.error('Error creating withdrawal:', err);
      return { error: err.message };
    }
  };

  return { withdrawals, isLoading, error, refetch: fetchWithdrawals, createWithdrawal };
}
