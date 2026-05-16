const isPlaceholderValue = (value?: string) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return ['your', 'placeholder', 'example', 'replace', 'null', 'undefined', 'changeme'].some(sub => normalized.includes(sub));
};

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYSTACK_SECRET_KEY',
  'CLIENT_URL'
];

const optionalEnv = [
  'GETUS_API_KEY',
  'MYZTADATA_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'USE_MOCK_PAYSTACK'
];

export const validateEnv = () => {
  const missing: string[] = [];
  const placeholder: string[] = [];
  const optionalMissing: string[] = [];

  requiredEnv.forEach((key) => {
    const value = process.env[key];
    if (!value) return missing.push(key);
    if (isPlaceholderValue(value)) return placeholder.push(key);
  });

  optionalEnv.forEach((key) => {
    const value = process.env[key];
    if (!value) optionalMissing.push(key);
  });

  if (missing.length) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
  }

  if (placeholder.length) {
    console.error('❌ Environment variables appear to be placeholder values:', placeholder.join(', '));
  }

  if (process.env.USE_MOCK_PAYSTACK !== 'false') {
    console.warn('⚠️ USE_MOCK_PAYSTACK is not explicitly set to false. Make sure this is false for production.');
  }

  if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('localhost')) {
    console.warn('⚠️ CLIENT_URL is set to localhost. Update this to the live frontend URL for production.');
  }

  if (optionalMissing.length) {
    console.warn('⚠️ Optional environment variables not set:', optionalMissing.join(', '));
  }

  return { missing, placeholder, optionalMissing };
};
