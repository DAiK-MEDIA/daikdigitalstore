import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { mockSupabase } from './mockSupabase';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const isPlaceholderValue = (value?: string) => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized === '' ||
    normalized.startsWith('your') ||
    normalized.includes('placeholder') ||
    normalized.includes('example') ||
    normalized.includes('replace') ||
    normalized.includes('your-project-ref') ||
    normalized.includes('your-service-role-key');
};

const hasValidSupabase = !isPlaceholderValue(supabaseUrl) && !isPlaceholderValue(supabaseServiceKey);

let supabase: any;

if (!hasValidSupabase) {
  console.warn('⚠️ Supabase credentials missing or placeholder values detected. Falling back to mock local data for development.');
  supabase = mockSupabase;
} else {
  supabase = createClient(
    supabaseUrl as string,
    supabaseServiceKey as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export { supabase };
