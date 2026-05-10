import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  console.log(`Checking for admin user: ${adminEmail}...`);

  // Try to create the user
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  if (error) {
    const isAlreadyRegistered = error.message.toLowerCase().includes('already') || 
                                error.message.toLowerCase().includes('registered');
    
    if (isAlreadyRegistered) {
      console.log('Admin user already exists. Syncing/Updating password...');
      
      // Get all users and find the one with the correct email
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError.message);
        return;
      }
      
      const user = listData.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
      if (user) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          password: adminPassword,
          email_confirm: true
        });
        
        if (updateError) {
          console.error('Error updating admin:', updateError.message);
        } else {
          console.log('✅ Admin credentials synced successfully.');
        }
      } else {
        console.error('Could not find user in list even though registration failed.');
      }
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  } else {
    console.log('✅ Admin user created successfully:', data.user?.id);
  }
}

createAdmin();
