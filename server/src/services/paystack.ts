import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
const isPlaceholderKey = (value?: string) => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized === '' || normalized.startsWith('your') || normalized.includes('placeholder') || normalized.includes('example') || normalized.includes('replace');
};

const useMockPaystack = process.env.USE_MOCK_PAYSTACK === 'true' && isPlaceholderKey(paystackSecretKey);

if (!process.env.PAYSTACK_SECRET_KEY || isPlaceholderKey(paystackSecretKey)) {
  console.warn('⚠️ Paystack secret missing or placeholder values detected. Live Paystack checkout will not be available until PAYSTACK_SECRET_KEY is set. To use mock checkout, set USE_MOCK_PAYSTACK=true.');
}

const paystackApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: paystackSecretKey ? `Bearer ${paystackSecretKey}` : '',
    'Content-Type': 'application/json',
  },
});

export const initializeTransaction = async (email: string, amount: number, reference: string) => {
  if (useMockPaystack) {
    throw new Error('Paystack mock mode is active. Set PAYSTACK_SECRET_KEY in the server .env or disable USE_MOCK_PAYSTACK to enable live Paystack checkout.');
  }

  if (!paystackSecretKey) {
    throw new Error('Paystack secret key is not configured. Set PAYSTACK_SECRET_KEY in the server .env to enable checkout.');
  }

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
    console.error('Paystack error:', error.response?.data || error.message);
    throw new Error(errorMsg);
  }
};

export const verifyTransaction = async (reference: string) => {
  if (useMockPaystack) {
    return {
      status: true,
      message: 'Mock Paystack verification successful',
      data: {
        reference,
        status: 'success',
      },
    };
  }

  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error: any) {
    console.error('Paystack error:', error.message);
    throw new Error('Failed to verify Paystack transaction');
  }
};
