import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
    const channel = supabase
      .channel(`footer-links-${scope}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_links' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['footer-links-public', scope] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, scope]);

  return useQuery({
    queryKey: ['footer-links-public', scope],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .eq('site_scope', scope)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data as FooterLink[];
    },
  });
};

export const useFooterContent = (scopeOverride?: string) => {
  const queryClient = useQueryClient();
  const scope = scopeOverride ?? "learn";

  useEffect(() => {
    const channel = supabase
      .channel(`footer-content-${scope}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_content' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['footer-content-public', scope] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, scope]);

  return useQuery({
    queryKey: ['footer-content-public', scope],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('footer_content')
        .select('*')
        .eq('site_scope', scope);

      if (error) throw error;
      return data as FooterContent[];
    },
  });
};
