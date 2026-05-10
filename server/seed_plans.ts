
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function seed() {
  const plans = [
    { size_label: '1GB', size_gb: 1, client_price: 10, agent_price: 8, is_active: true },
    { size_label: '2GB', size_gb: 2, client_price: 18, agent_price: 15, is_active: true },
    { size_label: '5GB', size_gb: 5, client_price: 40, agent_price: 35, is_active: true },
    { size_label: '10GB', size_gb: 10, client_price: 75, agent_price: 65, is_active: true },
    { size_label: '20GB', size_gb: 20, client_price: 140, agent_price: 120, is_active: true },
    { size_label: '50GB', size_gb: 50, client_price: 320, agent_price: 280, is_active: true },
  ];

  const { error } = await supabase.from('data_plans').insert(plans);
  if (error) console.error('Error seeding plans:', error);
  else console.log('Plans seeded successfully');
}

seed();
