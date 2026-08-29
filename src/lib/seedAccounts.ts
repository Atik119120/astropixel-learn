import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/lms';

export const TEST_ACCOUNTS = [
  { email: 'admin@astropixel.online', password: 'Admin@2026!', fullName: 'Admin User', role: 'admin' as AppRole },
  { email: 'teacher@astropixel.online', password: 'Teacher@2026!', fullName: 'Teacher User', role: 'teacher' as AppRole },
  { email: 'student@astropixel.online', password: 'Student@2026!', fullName: 'Student User', role: 'student' as AppRole },
];

export async function createTestAccounts(): Promise<string[]> {
  const results: string[] = [];

  for (const account of TEST_ACCOUNTS) {
    try {
      // Try signing up the user
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.fullName } }
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already')) {
          results.push(`⚠️ ${account.email} already exists — skipping signup`);
          // Still try to upsert profile/role in case they're missing
        } else {
          results.push(`❌ ${account.email}: ${error.message}`);
          continue;
        }
      }

      const userId = data?.user?.id;
      if (!userId && !error?.message?.includes('already')) {
        results.push(`❌ ${account.email}: no user ID returned`);
        continue;
      }

      if (userId) {
        // Upsert profile
        try {
          await supabase.from('profiles').upsert({
            user_id: userId,
            full_name: account.fullName,
            email: account.email,
            phone_number: '01700000000',
          }, { onConflict: 'user_id' });
        } catch {}

        // Upsert role
        try {
          await (supabase.from('user_roles') as any).upsert({
            user_id: userId,
            role: account.role,
          }, { onConflict: 'user_id' });
        } catch {}

        results.push(`✅ ${account.email} ready with role: ${account.role}`);
      }
    } catch (e: any) {
      results.push(`❌ ${account.email}: ${e.message}`);
    }
  }

  return results;
}

export const CREDENTIALS_INFO = `
📋 টেস্ট অ্যাকাউন্ট:
━━━━━━━━━━━━━━━━━━━━━━━━
👑 Admin:   admin@astropixel.online   / Admin@2026!
👨‍🏫 Teacher: teacher@astropixel.online / Teacher@2026!
🎓 Student: student@astropixel.online / Student@2026!
━━━━━━━━━━━━━━━━━━━━━━━━
`;
