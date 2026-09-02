"use client";

// Fallback dummy client to prevent crashes while migrating to Firebase
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: new Error("Migrated to Firebase") }),
    signUp: async () => ({ data: null, error: new Error("Migrated to Firebase") }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, opts: any) => {
        // Return success for dummy client
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        // Return a placeholder or mock URL
        return { data: { publicUrl: "https://ui-avatars.com/api/?name=User&background=random" } };
      }
    })
  },
  from: (table: string) => {
    return {
      select: () => {
        const query: any = {
          eq: () => query,
          or: () => query,
          order: () => query,
          limit: async () => ({ data: [], error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
          then: (cb: any) => cb({ data: [], error: null })
        };
        return query;
      },
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: () => {
        const updateQuery: any = {
          eq: async () => ({ data: null, error: null }),
          then: (cb: any) => cb({ data: null, error: null })
        };
        return updateQuery;
      },
      delete: () => {
        const deleteQuery: any = {
          eq: async () => ({ data: null, error: null }),
          then: (cb: any) => cb({ data: null, error: null })
        };
        return deleteQuery;
      }
    };
  }
} as any;

