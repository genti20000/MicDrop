import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }

  if (typeof window !== 'undefined') {
    const w = window as any;
    if (w.__ENV && w.__ENV[key] !== undefined) return w.__ENV[key];
    if (w[key] !== undefined) return w[key];
  }

  return undefined;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') ?? '';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL is not defined. Supabase client will be created with an empty URL.');
}

if (!supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Client-side operations will likely fail.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client only on server to avoid bundling service key into browser.
// If imported on the client, this will return the regular client instead.
export const supabaseAdmin = (() => {
  if (typeof window === 'undefined') {
    const key = supabaseServiceKey ?? supabaseAnonKey;
    if (!supabaseServiceKey) {
      // eslint-disable-next-line no-console
      console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY is not defined. Admin client will use anon key and will be permission-limited.');
    }
    return createClient(supabaseUrl, key);
  }
  return createClient(supabaseUrl, supabaseAnonKey);
})();
