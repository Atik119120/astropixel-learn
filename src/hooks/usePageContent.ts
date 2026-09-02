import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";

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
    const q = query(
      collection(db, 'page_content'),
      where('page_name', '==', pageName),
      where('site_scope', '==', scope)
    );
    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ['page-content-public', pageName, scope] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, pageName, scope]);

  const { data: contents, isLoading } = useQuery({
    queryKey: ['page-content-public', pageName, scope],
    queryFn: async () => {
      const q = query(
        collection(db, 'page_content'),
        where('page_name', '==', pageName),
        where('site_scope', '==', scope),
        where('is_active', '==', true)
      );
      try {
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PageContent[];
      } catch (error) {
        console.error('Error fetching page content:', error);
        return [];
      }
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
