import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/types/lms';
import { useEffect } from 'react';
import { INITIAL_REAL_YOUTUBE_COURSES, seedRealCoursesToDatabase } from '@/lib/seedCourses';

export function usePublicCourses() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Seed real YouTube courses on initial mount
    seedRealCoursesToDatabase().then(() => {
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
    }).catch(() => {});
  }, [queryClient]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('courses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public-courses'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: dbCourses, isLoading, error, refetch } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Course[];
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
