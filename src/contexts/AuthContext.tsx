"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/config';
import { AppRole, Profile } from '@/types/lms';

interface AuthContextType {
  user: User | null;
  session: any | null; // Keeping for compatibility, but Firebase doesn't use Supabase Session
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
  const [profile, setProfile] = useState<Profile | null>(lsGet(LS_PROFILE));
  const [role, setRole] = useState<AppRole | null>(cachedUser ? cachedRole : null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveToStorage = (u: any, p: Profile | null, r: AppRole | null) => {
    lsSet(LS_USER, u);
    lsSet(LS_PROFILE, p);
    lsSet(LS_ROLE, u && r ? r : null);
  };

  const resolveRole = (roleData: any, email: string): AppRole => {
    if (roleData?.role) {
      const r = roleData.role;
      if (r === 'admin' || r === 'teacher' || r === 'student') return r;
    }
    const e = (email || '').toLowerCase();
    if (e === 'admin@astropixel.online' || e.startsWith('admin@')) return 'admin';
    if (e === 'teacher@astropixel.online' || e.startsWith('teacher@')) return 'teacher';
    return 'student';
  };

  const fetchUserData = async (userId: string, email?: string): Promise<{ profile: Profile | null; role: AppRole }> => {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      const roleDoc = await getDoc(doc(db, 'user_roles', userId));

      const fetchedProfile = profileDoc.exists() ? (profileDoc.data() as Profile) : null;
      const fetchedRole = resolveRole(roleDoc.exists() ? roleDoc.data() : null, email || '');

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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      
      if (currentUser) {
        const { profile: p, role: r } = await fetchUserData(currentUser.uid, currentUser.email || undefined);
        if (mounted) {
          setUser(currentUser);
          setProfile(p);
          setRole(r);
          saveToStorage(currentUser, p, r);
          setIsLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
          saveToStorage(null, null, null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!email?.trim() || !password?.trim()) {
      return { error: new Error('ইমেইল এবং পাসওয়ার্ড দিন') };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const currentUser = userCredential.user;
      
      const { profile: p, role: r } = await fetchUserData(currentUser.uid, currentUser.email || undefined);
      setUser(currentUser);
      setProfile(p);
      setRole(r);
      saveToStorage(currentUser, p, r);
      
      return { error: null };
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { error: new Error('ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিয়ে চেষ্টা করুন।') };
      }
      return { error: new Error(`লগইন সমস্যা: ${error.message}`) };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string): Promise<{ error: Error | null }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const currentUser = userCredential.user;
      
      // Update display name in Firebase Auth
      await updateProfile(currentUser, { displayName: fullName });

      const userId = currentUser.uid;
      
      try {
        await setDoc(doc(db, 'profiles', userId), {
          user_id: userId,
          full_name: fullName,
          email: email.toLowerCase().trim(),
          phone_number: phoneNumber || null,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error setting profile:", err);
      }

      try {
        await setDoc(doc(db, 'user_roles', userId), {
          user_id: userId,
          role: 'student',
        });
      } catch (err) {
        console.error("Error setting role:", err);
      }

      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message) };
    }
  };

  const signInAsRole = async (_targetRole: AppRole, _email?: string, _password?: string): Promise<{ error: null }> => {
    throw new Error('Direct role impersonation is disabled. Use signIn() with valid credentials.');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setRole(null);
    saveToStorage(null, null, null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { profile: p, role: r } = await fetchUserData(user.uid, user.email || undefined);
    setProfile(p);
    setRole(r);
    saveToStorage(user, p, r);
  };

  const value: AuthContextType = {
    user,
    session: user ? { user } : null, // Mock session object for compatibility
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
