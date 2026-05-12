import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('data_plans').select('*').limit(1);
  if (error) {
    console.error('Error fetching data_plans:', error);
  } else {
    console.log('data_plans columns:', Object.keys(data[0] || {}));
  }

  const { data: orders, error: ordersError } = await supabase.from('orders').select('*').limit(1);
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
  } else {
    console.log('orders columns:', Object.keys(orders[0] || {}));
  }
}

checkSchema();
