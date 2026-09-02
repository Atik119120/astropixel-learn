import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";

export function usePageHero(pageName: string) {
  const { data } = useQuery({
    queryKey: ["page-hero", pageName],
    queryFn: async () => {
      const q = query(collection(db, "page_content"), where("page_name", "==", pageName));
      const snap = await getDocs(q);
      const map: Record<string, string> = {};
      snap.forEach((docSnap) => {
        const r = docSnap.data();
        if (r.content_en) map[r.content_key] = r.content_en;
      });
      return map;
    },
    staleTime: 30_000,
  });
  return (key: string, fallback?: string) => data?.[key] ?? fallback ?? "";
}
