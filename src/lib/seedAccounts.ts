import { auth, db } from '@/integrations/firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const TEST_ACCOUNTS = [
  {
    email: 'admin@astropixel.online',
    password: 'Admin@2026!',
    role: 'admin',
    fullName: 'Admin Demo'
  },
  {
    email: 'teacher@astropixel.online',
    password: 'Teacher@2026!',
    role: 'teacher',
    fullName: 'Teacher Demo'
  },
  {
    email: 'student@astropixel.online',
    password: 'Student@2026!',
    role: 'student',
    fullName: 'Student Demo'
  }
];

export async function createTestAccounts() {
  const results: string[] = [];
  
  for (const account of TEST_ACCOUNTS) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: account.fullName });
      
      const userId = user.uid;

      // Upsert profile
      try {
        await setDoc(doc(db, 'profiles', userId), {
          user_id: userId,
          full_name: account.fullName,
          email: account.email,
          phone_number: '01700000000',
        }, { merge: true });
      } catch (e: any) {
        console.warn(`Profile seed note for ${account.email}:`, e.message);
      }

      // Upsert role
      try {
        await setDoc(doc(db, 'user_roles', userId), {
          user_id: userId,
          role: account.role,
        }, { merge: true });
      } catch (e: any) {
        console.warn(`Role seed note for ${account.email}:`, e.message);
      }

      results.push(`✅ ${account.email} ready with role: ${account.role}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        results.push(`⚠️ ${account.email} already exists.`);
      } else {
        results.push(`❌ ${account.email} failed: ${error.message}`);
      }
    }
  }

  return results;
}
