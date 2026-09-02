import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { collection, query, where, orderBy, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";

interface FooterLink {
  id: string;
  link_type: string;
  title: string;
  url: string;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  site_scope?: string;
}

interface FooterContent {
  id: string;
  content_key: string;
  content_en: string | null;
  site_scope?: string;
}

export const useFooterLinks = (scopeOverride?: string) => {
  const queryClient = useQueryClient();
  const scope = scopeOverride ?? "learn";

  useEffect(() => {
    const q = query(
      collection(db, 'footer_links'),
      where('site_scope', '==', scope)
    );
    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ['footer-links-public', scope] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, scope]);

  return useQuery({
    queryKey: ['footer-links-public', scope],
    queryFn: async () => {
      const q = query(
        collection(db, 'footer_links'),
        where('site_scope', '==', scope),
        where('is_active', '==', true),
        orderBy('order_index')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FooterLink[];
    },
  });
};

export const useFooterContent = (scopeOverride?: string) => {
  const queryClient = useQueryClient();
  const scope = scopeOverride ?? "learn";

  useEffect(() => {
    const q = query(
      collection(db, 'footer_content'),
      where('site_scope', '==', scope)
    );
    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ['footer-content-public', scope] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, scope]);

  return useQuery({
    queryKey: ['footer-content-public', scope],
    queryFn: async () => {
      const q = query(
        collection(db, 'footer_content'),
        where('site_scope', '==', scope)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FooterContent[];
    },
  });
};
