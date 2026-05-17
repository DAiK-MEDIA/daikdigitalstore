import { supabase } from '../server/src/services/supabase';

async function run() {
  try {
    const { data, error } = await supabase.from('admin_settings').select('*');
    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }
    console.log('--- ADMIN SETTINGS ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Execution error:', err);
  }
}

run();
