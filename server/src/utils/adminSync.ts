import { createClient } from '@supabase/supabase-js';

export const syncAdminFromEnv = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
    console.log('⚠️ Admin sync skipped: Missing environment variables.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Try to create the user
    const { error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    if (error) {
      if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
        // User exists, do not overwrite the password to preserve changes made via the admin dashboard
        console.log(`ℹ️ Admin user already exists: ${adminEmail} (skipping password sync to prevent overwriting)`);
      } else {
        console.error('❌ Admin sync error:', error.message);
      }
    } else {
      console.log(`✅ Admin created: ${adminEmail}`);
    }
  } catch (err: any) {
    console.error('❌ Admin sync failed:', err.message);
  }
};
