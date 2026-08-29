import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

      let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;

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

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

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
      const { data: studentCourseData } = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      let courseIds = studentCourseData ? studentCourseData.map(sc => sc.course_id) : [];

      // Fetch all published courses
      const { data: allPublishedCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true);

      const publishedList = (allPublishedCourses && allPublishedCourses.length > 0) 
        ? allPublishedCourses 
        : INITIAL_REAL_YOUTUBE_COURSES;

      // Auto-enroll student in all published courses if not enrolled yet
      const missingCourseIds = publishedList
        .map(c => c.id)
        .filter(id => !courseIds.includes(id));

      if (missingCourseIds.length > 0 && user.id) {
        for (const mId of missingCourseIds) {
          try {
            await supabase.from('student_courses').upsert({
              user_id: user.id,
              course_id: mId,
              is_active: true,
              created_at: new Date().toISOString(),
            }, { onConflict: 'user_id,course_id' });
          } catch {}
        }
        courseIds = publishedList.map(c => c.id);
      }

      // Fetch videos for these courses
      const { data: dbVideos } = await supabase
        .from('videos')
        .select('*')
        .in('course_id', courseIds)
        .order('order_index', { ascending: true });

      // Fetch video progress
      const { data: progressData } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id);

      // Fetch course completions
      const { data: completionsData } = await supabase
        .from('course_completions')
        .select('*')
        .eq('user_id', user.id);

      const progressMap = new Map((progressData || []).map((p: VideoProgress) => [p.video_id, p]));
      const completionSet = new Set((completionsData || []).map((c: { course_id: string }) => c.course_id));

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
      const { data } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle();

      setProgress(data as VideoProgress | null);
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
      const { data, error } = await supabase.from('video_progress').upsert({
        user_id: user.id,
        video_id: videoId,
        progress_percent: Math.min(percent, 100),
        is_completed: isCompleted,
        last_watched_at: new Date().toISOString(),
      }, { onConflict: 'user_id,video_id' }).select().maybeSingle();

      if (!error && data) {
        setProgress(data as VideoProgress);
      }
      return { data, error };
    } catch (e) {
      console.error('Error updating progress:', e);
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  };

  return { progress, isLoading, updateProgress, refetch: fetchProgress };
}
