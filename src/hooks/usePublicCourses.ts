import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { Course } from '@/types/lms';
import { useEffect } from 'react';
import { INITIAL_REAL_YOUTUBE_COURSES, seedRealCoursesToDatabase } from '@/lib/seedCourses';

export function usePublicCourses() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Seed real YouTube courses on initial mount
    (async () => {
      try { await seedRealCoursesToDatabase(); } catch {}
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
    })();
  }, [queryClient]);

  // Set up realtime subscription
  useEffect(() => {
    const q = query(collection(db, 'courses'), where('is_published', '==', true));
    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const { data: dbCourses, isLoading, error, refetch } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const q = query(
        collection(db, 'courses'),
        where('is_published', '==', true),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data as Course[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const courses = (dbCourses && dbCourses.length > 0) 
    ? dbCourses 
    : (INITIAL_REAL_YOUTUBE_COURSES as Course[]);

  return { 
    courses, 
    isLoading, 
    error: error ? (error instanceof Error ? error.message : 'An error occurred') : null, 
    refetch 
  };
}
