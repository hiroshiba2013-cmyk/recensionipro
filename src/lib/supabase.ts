import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Intercept fetch to log failing Supabase requests
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
  const isSupabase = url.includes(supabaseUrl);
  const res = await originalFetch(...args);
  if (isSupabase && !res.ok) {
    const cloned = res.clone();
    cloned.text().then(body => {
      console.error('[SUPABASE FAIL]', res.status, url.replace(supabaseUrl, ''), body);
    });
  }
  return res;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
