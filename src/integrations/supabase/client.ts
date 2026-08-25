// Static client-side storage replacement for Supabase
const mockUser = {
  id: "student-123",
  email: "student@astropixel.online",
  user_metadata: { full_name: "Student User", role: "student" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString()
};

const mockProfile = {
  id: "student-123",
  user_id: "student-123",
  full_name: "Student User",
  email: "student@astropixel.online",
  role: "student",
  created_at: new Date().toISOString()
};

const createMockQueryBuilder = (tableName: string) => {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    is: () => builder,
    like: () => builder,
    ilike: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: async () => ({ data: mockProfile, error: null }),
    maybeSingle: async () => ({ data: mockProfile, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null })
  };
  return builder;
};

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user: mockUser, access_token: "mock-static-token" } }, error: null }),
    getUser: async () => ({ data: { user: mockUser }, error: null }),
    signInWithPassword: async ({ email }: any) => ({ data: { user: { ...mockUser, email }, session: { user: mockUser, access_token: "mock-static-token" } }, error: null }),
    signUp: async ({ email }: any) => ({ data: { user: { ...mockUser, email }, session: { user: mockUser, access_token: "mock-static-token" } }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => callback("SIGNED_IN", { user: mockUser }), 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: mockUser }, error: null })
  },
  from: (table: string) => createMockQueryBuilder(table),
  rpc: async () => ({ data: [], error: null }),
  channel: (name: string) => {
    const mockChannel = {
      on: () => mockChannel,
      subscribe: () => mockChannel,
      unsubscribe: () => {}
    };
    return mockChannel;
  },
  removeChannel: async (channel: any) => ({ error: null }),
  removeAllChannels: async () => ({ error: null }),
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: "mock/path" }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      remove: async () => ({ error: null })
    })
  },
  functions: {
    invoke: async () => ({ data: { success: true }, error: null })
  }
} as any;