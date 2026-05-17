import axios from 'axios';

/**
 * Helper to read the Paystack secret at call time (not module-load time)
 * so that dotenv / Vercel env vars are guaranteed to be available.
 */
const getPaystackKey = (): string => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is not configured. ' +
      'Set it in the server .env file (local) or in the Vercel Environment Variables dashboard (production).'
    );
  }
  return key;
};

const paystackApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject the Authorization header dynamically on every request
// so the key is always read from the live process.env value.
paystackApi.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getPaystackKey()}`;
  return config;
});

export const initializeTransaction = async (email: string, amount: number, reference: string) => {
  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // Paystack expects amount in pesewas (subunits)
      reference,
      callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/status/${reference}`,
    });
    return response.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Failed to initialize Paystack transaction';
    console.error('Paystack init error:', error.response?.data || error.message);
    throw new Error(errorMsg);
  }
};

export const verifyTransaction = async (reference: string) => {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error: any) {
    console.error('Paystack verify error:', error.response?.data || error.message);
    throw new Error('Failed to verify Paystack transaction');
  }
};
