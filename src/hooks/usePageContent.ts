import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo } from "react";

interface PageContent {
  id: string;
  page_name: string;
  content_key: string;
  content_en: string | null;
  site_scope?: string;
}

export const usePageContent = (pageName: string, scopeOverride?: string) => {
  const queryClient = useQueryClient();
  const scope = scopeOverride ?? "learn";

  useEffect(() => {
    const channel = supabase
      .channel(`page-content-${pageName}-${scope}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_content' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['page-content-public', pageName, scope] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, pageName, scope]);

  const { data: contents, isLoading } = useQuery({
    queryKey: ['page-content-public', pageName, scope],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_name', pageName)
        .eq('site_scope', scope)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching page content:', error);
        return [];
      }
      return data as PageContent[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const contentMap = useMemo(() => {
    const map = new Map<string, string>();
    if (contents) {
      contents.forEach(item => {
        map.set(item.content_key, item.content_en || '');
      });
    }
    return map;
  }, [contents]);

  const getContent = (key: string, fallback: string = ''): string => {
    return contentMap.get(key) || fallback;
  };

  return {
    getContent,
    contents,
    isLoading,
  };
};
