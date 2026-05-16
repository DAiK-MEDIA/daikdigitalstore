import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const getusApiKey = process.env.GETUS_API_KEY?.trim();
const isPlaceholderKey = (value?: string) => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized === '' || normalized.startsWith('your') || normalized.includes('placeholder') || normalized.includes('example') || normalized.includes('replace');
};

if (isPlaceholderKey(getusApiKey)) {
  console.warn('⚠️ GetUs API key missing or placeholder detected. GetUs auto-fulfillment will not work.');
}

const getusClient = axios.create({
  baseURL: 'https://getus.site/wp-json/ddm/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': getusApiKey || '',
  },
});

const getGetUsError = (error: any) => {
  if (error?.response?.data) return error.response.data;
  return { message: error?.message || 'Unknown GetUs error' };
};

export const placeDataOrder = async (network: string, packageGb: number, recipient: string) => {
  if (!getusApiKey || isPlaceholderKey(getusApiKey)) {
    throw new Error('Missing GETUS_API_KEY in server environment.');
  }

  try {
    const response = await getusClient.post('/order', {
      network,
      package_gb: packageGb,
      recipient,
    });

    if (response.data?.status !== 'success') {
      throw new Error(response.data?.message || 'GetUs order placement failed.');
    }

    return {
      status: response.data.status,
      order_id: response.data.order_id,
      price: response.data.price,
      raw: response.data,
    };
  } catch (error: any) {
    const err = getGetUsError(error);
    console.error('GetUs Place Order Error:', err);
    throw new Error(err.message || 'GetUs order placement failed.');
  }
};

export const checkOrderStatus = async (orderId: string | number) => {
  if (!getusApiKey || isPlaceholderKey(getusApiKey)) {
    throw new Error('Missing GETUS_API_KEY in server environment.');
  }

  try {
    const response = await getusClient.get(`/order-status?order_id=${orderId}`);
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid GetUs order status response.');
    }
    return response.data;
  } catch (error: any) {
    const err = getGetUsError(error);
    console.error('GetUs Check Status Error:', err);
    throw new Error(err.message || 'GetUs order status check failed.');
  }
};

