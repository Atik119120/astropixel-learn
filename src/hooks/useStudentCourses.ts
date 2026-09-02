import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, setDoc, deleteDoc, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { Course, Profile } from '@/types/lms';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentWithCourses {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  courses: Course[];
}

export function useStudentCourseManagement() {
  const [students, setStudents] = useState<StudentWithCourses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const fetchStudents = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch all student profiles (users with student role)
      const qRoles = query(collection(db, 'user_roles'), where('role', '==', 'student'));
      const rolesSnap = await getDocs(qRoles);
      const studentRoles = rolesSnap.docs.map(d => d.data());

      if (!studentRoles || studentRoles.length === 0) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      const studentUserIds = studentRoles.map(r => r.user_id);

      // Fetch profiles for students
      const profilesSnap = await getDocs(query(collection(db, 'profiles'), orderBy('created_at', 'desc')));
      const profiles = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Profile).filter(p => studentUserIds.includes(p.user_id));

      // Fetch all student_courses assignments
      const assignSnap = await getDocs(query(collection(db, 'student_courses'), where('is_active', '==', true)));
      const assignments = assignSnap.docs.map(d => d.data()).filter(a => studentUserIds.includes(a.user_id));

      // Fetch all courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Course);

      const coursesMap = new Map((coursesData || []).map((c: Course) => [c.id, c]));

      // Build students with courses
      const studentsWithCourses: StudentWithCourses[] = (profiles || []).map((profile: Profile) => {
        const studentAssignments = (assignments || []).filter(
          (a: { user_id: string }) => a.user_id === profile.user_id
        );

        const courses = studentAssignments
          .map((a: { course_id: string }) => coursesMap.get(a.course_id))
          .filter((c: Course | undefined): c is Course => c !== undefined);

        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          phone_number: profile.phone_number,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          courses,
        };
      });

      setStudents(studentsWithCourses);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Realtime auto-refresh
  const refreshTimerRef = useRef<number | null>(null);

  const scheduleRefetch = useCallback(() => {
    if (!isAdmin) return;
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      fetchStudents();
    }, 250);
  }, [fetchStudents, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubStudents = onSnapshot(collection(db, 'student_courses'), () => scheduleRefetch());
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), () => scheduleRefetch());

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      unsubStudents();
      unsubProfiles();
    };
  }, [isAdmin, scheduleRefetch]);

  const assignCourse = async (userId: string, courseId: string) => {
    try {
      await addDoc(collection(db, 'student_courses'), { user_id: userId, course_id: courseId, is_active: true });
      await fetchStudents();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const removeCourse = async (userId: string, courseId: string) => {
    try {
      const q = query(collection(db, 'student_courses'), where('user_id', '==', userId), where('course_id', '==', courseId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      await fetchStudents();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    students,
    isLoading,
    error,
    refetch: fetchStudents,
    assignCourse,
    removeCourse,
  };
}
