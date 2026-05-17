import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const paystackApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
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
    console.error('Paystack error:', error.message);
    throw new Error(errorMsg);
  }
};

export const verifyTransaction = async (reference: string) => {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error: any) {
    console.error('Paystack error:', error.message);
    throw new Error('Failed to verify Paystack transaction');
  }
};
