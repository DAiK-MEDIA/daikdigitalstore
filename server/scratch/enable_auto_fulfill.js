const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/wm/Herd/daikdigitalstore/server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase
    .from('admin_settings')
    .update({ value: 'true' })
    .eq('key', 'auto_fulfill_api')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully enabled auto_fulfill_api setting:');
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
