const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const accounts = [
  { email: 'admin@astropixel.online', password: 'Admin@2026!', fullName: 'Admin User', role: 'admin' },
  { email: 'teacher@astropixel.online', password: 'Teacher@2026!', fullName: 'Teacher User', role: 'teacher' },
  { email: 'student@astropixel.online', password: 'Student@2026!', fullName: 'Student User', role: 'student' }
];

async function seed() {
  console.log('Starting seed...');
  for (const acc of accounts) {
    try {
      console.log(`Creating ${acc.email}...`);
      const { data, error } = await supabase.auth.signUp({
        email: acc.email,
        password: acc.password,
        options: { data: { full_name: acc.fullName } }
      });

      if (error) {
        if (error.message.includes('already')) {
          console.log(`⚠️ ${acc.email} already registered`);
        } else {
          console.error(`❌ Error creating ${acc.email}:`, error.message);
        }
      }

      // Try to log in just to get the ID if it already exists, but signup returns data.user if email confirmations are off
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password
      });

      const userId = data?.user?.id || signInData?.user?.id;

      if (userId) {
        await supabase.from('profiles').upsert({
          user_id: userId,
          email: acc.email,
          full_name: acc.fullName,
          phone_number: '01700000000'
        }, { onConflict: 'user_id' });

        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: acc.role
        }, { onConflict: 'user_id' });
        
        console.log(`✅ Fully seeded ${acc.email} as ${acc.role}`);
      } else {
        console.log(`❌ Could not get user ID for ${acc.email}`);
      }
    } catch (err) {
      console.error(`Exception for ${acc.email}:`, err);
    }
  }
  console.log('Done!');
}

seed();
