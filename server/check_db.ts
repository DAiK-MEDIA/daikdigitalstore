
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: plans, error: pError } = await supabase.from('data_plans').select('*');
  const { data: settings, error: sError } = await supabase.from('admin_settings').select('*');

  console.log('--- PLANS ---');
  console.log(plans);
  console.log('--- SETTINGS ---');
  console.log(settings);
}

checkData();
