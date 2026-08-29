"use client";

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
  isTeacher: boolean;
  isStudent: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInAsRole: (targetRole: AppRole, email?: string, password?: string) => Promise<{ error: null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_USER = 'ap_user';
const LS_PROFILE = 'ap_profile';
const LS_ROLE = 'ap_role';

function lsGet(key: string) {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function lsSet(key: string, val: any) {
  if (typeof window === 'undefined') return;
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cachedUser = lsGet(LS_USER);
  const cachedRole = lsGet(LS_ROLE) as AppRole | null;

  const [user, setUser] = useState<User | null>(cachedUser);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(lsGet(LS_PROFILE));
  const [role, setRole] = useState<AppRole | null>(cachedUser ? cachedRole : null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveToStorage = (u: any, p: Profile | null, r: AppRole | null) => {
    lsSet(LS_USER, u);
    lsSet(LS_PROFILE, p);
    lsSet(LS_ROLE, u && r ? r : null);
  };

  const resolveRole = (roles: Array<{ role: AppRole }> | null, email: string): AppRole => {
    if (roles?.length) {
      const r = roles[0].role;
      if (r === 'admin' || r === 'teacher' || r === 'student') return r;
    }
    const e = (email || '').toLowerCase();
    if (e === 'admin@astropixel.online' || e.startsWith('admin@')) return 'admin';
    if (e === 'teacher@astropixel.online' || e.startsWith('teacher@')) return 'teacher';
    return 'student';
  };

  const fetchUserData = async (userId: string, email?: string): Promise<{ profile: Profile | null; role: AppRole }> => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        (supabase.from('user_roles') as any).select('role').eq('user_id', userId)
      ]);

      const fetchedProfile = profileRes.data as Profile | null;
      const fetchedRole = resolveRole(rolesRes.data, email || '');

      if (!fetchedProfile) {
        const fallback = {
          id: userId,
          user_id: userId,
          full_name: (email || '').split('@')[0] || 'User',
          email: email || '',
          phone_number: null,
          avatar_url: null,
          created_at: new Date().toISOString()
        } as unknown as Profile;
        return { profile: fallback, role: fetchedRole };
      }

      return { profile: fetchedProfile, role: fetchedRole };
    } catch {
      const e = (email || '').toLowerCase();
      const fallbackRole: AppRole = e.includes('admin') ? 'admin' : e.includes('teacher') ? 'teacher' : 'student';
      return {
        profile: {
          id: userId,
          user_id: userId,
          full_name: (email || '').split('@')[0] || 'User',
          email: email || '',
          phone_number: null,
          avatar_url: null,
          created_at: new Date().toISOString()
        } as unknown as Profile,
        role: fallbackRole
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (currentSession?.user) {
          const { profile: p, role: r } = await fetchUserData(currentSession.user.id, currentSession.user.email);
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            setProfile(p);
            setRole(r);
            saveToStorage(currentSession.user, p, r);
          }
        } else {
          // No active session — clear stale cache
          if (mounted) {
            setUser(null);
            setProfile(null);
            setRole(null);
            setSession(null);
            saveToStorage(null, null, null);
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);

      if (currentSession?.user) {
        const { profile: p, role: r } = await fetchUserData(currentSession.user.id, currentSession.user.email);
        if (mounted) {
          setUser(currentSession.user);
          setProfile(p);
          setRole(r);
          saveToStorage(currentSession.user, p, r);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setSession(null);
          saveToStorage(null, null, null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!email?.trim() || !password?.trim()) {
      return { error: new Error('ইমেইল এবং পাসওয়ার্ড দিন') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return { error: new Error('ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিয়ে চেষ্টা করুন।') };
    }

    if (data?.user) {
      const { profile: p, role: r } = await fetchUserData(data.user.id, data.user.email);
      setUser(data.user);
      setProfile(p);
      setRole(r);
      setSession(data.session);
      saveToStorage(data.user, p, r);
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string): Promise<{ error: Error | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) return { error: new Error(error.message) };

    if (data?.user) {
      const userId = data.user.id;
      try {
        await supabase.from('profiles').insert({
          user_id: userId,
          full_name: fullName,
          email: email.toLowerCase().trim(),
          phone_number: phoneNumber || null,
        });
      } catch {}

      try {
        await (supabase.from('user_roles') as any).insert({
          user_id: userId,
          role: 'student',
        });
      } catch {}
    }

    return { error: null };
  };

  // Intentionally disabled — use proper signIn() with real credentials
  const signInAsRole = async (_targetRole: AppRole, _email?: string, _password?: string): Promise<{ error: null }> => {
    throw new Error('Direct role impersonation is disabled. Use signIn() with valid credentials.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setSession(null);
    saveToStorage(null, null, null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { profile: p, role: r } = await fetchUserData(user.id, user.email);
    setProfile(p);
    setRole(r);
    saveToStorage(user, p, r);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isLoading,
    isAdmin: !!user && role === 'admin',
    isTeacher: !!user && role === 'teacher',
    isStudent: !!user && role === 'student',
    signUp,
    signIn,
    signInAsRole,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
