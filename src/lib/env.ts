export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://ayqbpqgahtycrncbknvj.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cWJwcWdhaHR5Y3JuY2JrbnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDU5OTgsImV4cCI6MjA4NDMyMTk5OH0.AQXrmhtMhjXrlb3spjKdD9dp0XQbiTzhexTpEKmdO0o";

export const SUPABASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ||
  process.env.VITE_SUPABASE_PROJECT_ID ||
  "ayqbpqgahtycrncbknvj";
