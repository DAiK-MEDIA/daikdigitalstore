import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (value?: string) => {
  return !value || value.trim() === '' || /your|placeholder|example|replace/i.test(value);
};

const createMockSupabase = () => {
  const chain = () => ({
    select: chain,
    in: chain,
    eq: chain,
    order: chain,
    update: chain,
    insert: chain,
    delete: chain,
    single: async () => ({ data: null, error: null }),
    then: async (resolve: any) => resolve({ data: null, error: null }),
    catch: () => ({})
  });

  return {
    from: chain,
    channel: () => ({
      on: () => ({
        subscribe: () => ({})
      })
    }),
    removeChannel: () => {},
  };
};

let supabase: any;

if (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized.');
} else {
  supabase = createMockSupabase();
  console.warn('Supabase credentials missing or invalid. Using local mock client for development.');
}

export { supabase };
