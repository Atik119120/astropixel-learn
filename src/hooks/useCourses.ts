import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { Course, Video, CourseWithVideos, CourseWithProgress, VideoWithProgress, VideoProgress } from '@/types/lms';
import { useAuth } from '@/contexts/AuthContext';
import { INITIAL_REAL_YOUTUBE_COURSES, seedRealCoursesToDatabase } from '@/lib/seedCourses';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      try { await seedRealCoursesToDatabase(); } catch {}

      let q = query(collection(db, 'courses'), orderBy('created_at', 'desc'));
      
      if (!isAdmin) {
        q = query(collection(db, 'courses'), where('is_published', '==', true), orderBy('created_at', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (data && data.length > 0) {
        setCourses(data as Course[]);
      } else {
        setCourses(INITIAL_REAL_YOUTUBE_COURSES as Course[]);
      }
    } catch (err: unknown) {
      setCourses(INITIAL_REAL_YOUTUBE_COURSES as Course[]);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [isAdmin]);

  return { courses, isLoading, error, refetch: fetchCourses };
}

export function useCourseWithVideos(courseId: string) {
  const [course, setCourse] = useState<CourseWithVideos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = async () => {
    setIsLoading(true);
    try {
      try { await seedRealCoursesToDatabase(); } catch {}

      const courseDocRef = doc(db, 'courses', courseId);
      const courseDocSnap = await getDoc(courseDocRef);
      const courseData = courseDocSnap.exists() ? { id: courseDocSnap.id, ...courseDocSnap.data() } : null;

      const videosQuery = query(collection(db, 'videos'), where('course_id', '==', courseId), orderBy('order_index', 'asc'));
      const videosSnapshot = await getDocs(videosQuery);
      const videosData = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (courseData) {
        setCourse({
          ...(courseData as Course),
          videos: (videosData || []) as Video[],
        });
      } else {
        // Fallback to INITIAL_REAL_YOUTUBE_COURSES
        const found = INITIAL_REAL_YOUTUBE_COURSES.find(c => c.id === courseId);
        if (found) {
          setCourse(found);
        } else {
          throw new Error('Course not found');
        }
      }
    } catch (err: unknown) {
      const found = INITIAL_REAL_YOUTUBE_COURSES.find(c => c.id === courseId);
      if (found) {
        setCourse(found);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  return { course, isLoading, error, refetch: fetchCourse };
}

export function useStudentCourses() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStudentCourses = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      try { await seedRealCoursesToDatabase(); } catch {}

      // Get course IDs assigned to this student via student_courses
      const studentCoursesQuery = query(collection(db, 'student_courses'), where('user_id', '==', user.uid), where('is_active', '==', true));
      const studentCourseDataSnapshot = await getDocs(studentCoursesQuery);
      const studentCourseData = studentCourseDataSnapshot.docs.map(doc => doc.data());

      let courseIds = studentCourseData ? studentCourseData.map(sc => sc.course_id) : [];

      // Fetch all published courses
      const publishedCoursesQuery = query(collection(db, 'courses'), where('is_published', '==', true));
      const allPublishedCoursesSnapshot = await getDocs(publishedCoursesQuery);
      const allPublishedCourses = allPublishedCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];

      const publishedList = (allPublishedCourses && allPublishedCourses.length > 0) 
        ? allPublishedCourses 
        : INITIAL_REAL_YOUTUBE_COURSES as Course[];

      // Auto-enroll student in all published courses if not enrolled yet
      const missingCourseIds = publishedList
        .map(c => c.id)
        .filter(id => !courseIds.includes(id));

      if (missingCourseIds.length > 0 && user.uid) {
        for (const mId of missingCourseIds) {
          try {
            const docId = `${user.uid}_${mId}`;
            await setDoc(doc(db, 'student_courses', docId), {
              user_id: user.uid,
              course_id: mId,
              is_active: true,
              created_at: new Date().toISOString(),
            }, { merge: true });
          } catch {}
        }
        courseIds = publishedList.map(c => c.id);
      }

      // Fetch videos for these courses
      let dbVideos: Video[] = [];
      if (courseIds.length > 0) {
        // Firestore 'in' query supports up to 10 items.
        // We do multiple queries if needed, or we just fetch all videos.
        // For simplicity we just fetch all and filter client side.
        const vQuery = query(collection(db, 'videos'), orderBy('order_index', 'asc'));
        const vSnapshot = await getDocs(vQuery);
        dbVideos = vSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Video[];
        dbVideos = dbVideos.filter(v => courseIds.includes(v.course_id));
      }

      // Fetch video progress
      const progressQuery = query(collection(db, 'video_progress'), where('user_id', '==', user.uid));
      const progressSnapshot = await getDocs(progressQuery);
      const progressData = progressSnapshot.docs.map(d => d.data() as VideoProgress);

      // Fetch course completions
      const completionsQuery = query(collection(db, 'course_completions'), where('user_id', '==', user.uid));
      const completionsSnapshot = await getDocs(completionsQuery);
      const completionsData = completionsSnapshot.docs.map(d => d.data());

      const progressMap = new Map((progressData || []).map((p: VideoProgress) => [p.video_id, p]));
      const completionSet = new Set((completionsData || []).map((c: any) => c.course_id));

      const coursesWithProgress: CourseWithProgress[] = publishedList.map((course: Course) => {
        // Collect videos from DB or fallback static definitions
        const fallbackCourse = INITIAL_REAL_YOUTUBE_COURSES.find(ic => ic.id === course.id);
        const courseVideos = (dbVideos && dbVideos.filter((v: Video) => v.course_id === course.id).length > 0)
          ? dbVideos.filter((v: Video) => v.course_id === course.id)
          : (fallbackCourse?.videos || []);

        let lastCompletedIndex = -1;
        const videosWithProgress: VideoWithProgress[] = courseVideos.map((video: Video, index: number) => {
          const progress = progressMap.get(video.id) as VideoProgress | undefined;
          const isCompleted = progress?.is_completed || false;
          
          if (isCompleted) {
            lastCompletedIndex = index;
          }

          const isLocked = index > 0 && lastCompletedIndex < index - 1;

          return {
            ...video,
            progress,
            is_locked: isLocked,
          };
        });

        // Recalculate locks
        for (let i = 1; i < videosWithProgress.length; i++) {
          const prevVideo = videosWithProgress[i - 1];
          videosWithProgress[i].is_locked = !prevVideo.progress?.is_completed;
        }

        const completedCount = videosWithProgress.filter(v => v.progress?.is_completed).length;
        const totalVideos = videosWithProgress.length;
        const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

        return {
          ...course,
          videos: videosWithProgress,
          total_videos: totalVideos,
          completed_videos: completedCount,
          progress_percent: progressPercent,
          is_completed: completionSet.has(course.id),
        };
      });

      setCourses(coursesWithProgress);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentCourses();
  }, [user]);

  return { courses, isLoading, error, refetch: fetchStudentCourses };
}

export function useVideoProgress(videoId: string) {
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchProgress = async () => {
    if (!user || !videoId) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'video_progress'), where('user_id', '==', user.uid), where('video_id', '==', videoId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setProgress(snapshot.docs[0].data() as VideoProgress);
      } else {
        setProgress(null);
      }
    } catch (e) {
      console.error('Error fetching video progress:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user, videoId]);

  const updateProgress = async (percent: number = 100, isCompleted: boolean = true) => {
    if (!user || !videoId) return { error: new Error('User or video not found') };
    try {
      const docId = `${user.uid}_${videoId}`;
      const progressData = {
        user_id: user.uid,
        video_id: videoId,
        progress_percent: Math.min(percent, 100),
        is_completed: isCompleted,
        last_watched_at: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'video_progress', docId), progressData, { merge: true });
      setProgress(progressData as VideoProgress);
      
      return { data: progressData, error: null };
    } catch (e) {
      console.error('Error updating progress:', e);
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  };

  return { progress, isLoading, updateProgress, refetch: fetchProgress };
}
