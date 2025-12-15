
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Helper to handle environment variables in different environments (Next.js vs Vite vs Browser)
const getEnvVar = (key: string) => {
  // Check for process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Use fallbacks to prevent crash if env vars are missing (e.g. during build or initial preview)
export const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'placeholder-key';
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// Client-side / Public usage
// Uses createBrowserClient to automatically handle cookies in Next.js App Router
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server-side / Admin usage (Bypasses RLS)
// Use service key if available, otherwise fall back to anon key to prevent crash.
// Admin operations will fail permissions if service key is missing, which is expected/secure.
export const supabaseAdmin = createClient(SUPABASE_URL, supabaseServiceKey || SUPABASE_ANON_KEY);
