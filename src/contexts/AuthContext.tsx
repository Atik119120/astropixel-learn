import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/lms';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = React.useRef(false);

  const isRefreshTokenNotFoundError = (err: unknown) => {
    const anyErr = err as any;
    const code = String(anyErr?.code ?? '').toLowerCase();
    const message = String(anyErr?.message ?? '').toLowerCase();
    return (
      code === 'refresh_token_not_found' ||
      message.includes('refresh token not found') ||
      message.includes('invalid refresh token')
    );
  };

  const resolvePrimaryRole = (roles: Array<{ role: AppRole }> | null | undefined): AppRole | null => {
    if (!roles?.length) return null;

    const roleSet = new Set(roles.map(({ role }) => role));

    if (roleSet.has('admin')) return 'admin';
    if (roleSet.has('teacher')) return 'teacher';
    if (roleSet.has('student')) return 'student';

    return null;
  };

  const fetchUserData = async (userId: string): Promise<{ profile: Profile | null; role: AppRole | null }> => {
    try {
      // Fetch profile and role in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .returns<Array<{ role: AppRole }>>()
      ]);

      const fetchedProfile = profileResult.data ? (profileResult.data as Profile) : null;
      const fetchedRole = resolvePrimaryRole(roleResult.data);

      return { profile: fetchedProfile, role: fetchedRole };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { profile: null, role: null };
    }
  };

  const ensureOnboarding = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ensure-student-onboarding', {
        body: {},
      });

      if (error) {
        console.error('ensure-student-onboarding error:', error);
        return;
      }

      if (data?.error) {
        console.error('ensure-student-onboarding failed:', data.error);
      }
    } catch (e) {
      console.error('ensure-student-onboarding unexpected error:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async (currentSession: Session | null) => {
      if (!isMounted) return;

      if (currentSession?.user) {
        try {
          // Run onboarding asynchronously in background without blocking auth
          ensureOnboarding().catch((err) => console.error('Onboarding background error:', err));
          
          // Fetch user data
          const { profile: fetchedProfile, role: fetchedRole } = await fetchUserData(currentSession.user.id);
          
          if (isMounted) {
            setProfile(fetchedProfile);
            setRole(fetchedRole);
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          if (isMounted) {
            setProfile(null);
            setRole(null);
          }
        }
      } else {
        if (isMounted) {
          setProfile(null);
          setRole(null);
        }
      }

      if (isMounted) {
        setIsLoading(false);
        isInitializedRef.current = true;
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Update session and user synchronously
      setSession(session);
      setUser(session?.user ?? null);

      // Only set loading true if we're initialized (not during initial load)
      if (isInitializedRef.current) {
        setIsLoading(true);
      }

      // Handle auth changes with setTimeout to avoid deadlocks
      setTimeout(() => {
        initializeAuth(session);
      }, 0);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // If browser has an old/invalid refresh token cached, clear it so login pages can load.
      if (error && isRefreshTokenNotFoundError(error)) {
        console.warn('Clearing invalid cached session (refresh token not found)');
        setSession(null);
        setUser(null);

        // Defer signOut to avoid any potential auth callback deadlocks
        setTimeout(() => {
          supabase.auth
            .signOut()
            .catch(() => {
              // ignore
            })
            .finally(() => {
              initializeAuth(null);
            });
        }, 0);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      initializeAuth(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          full_name: fullName,
          email: email,
          phone_number: phoneNumber || null,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Assign student role by default
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: 'student',
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isLoading,
    isAdmin: role === 'admin',
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
