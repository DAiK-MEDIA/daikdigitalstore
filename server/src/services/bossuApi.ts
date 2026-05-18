import axios from 'axios';

const bossuClient = axios.create({
  baseURL: 'https://bossudatahub.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

bossuClient.interceptors.request.use((config) => {
  config.headers['X-API-Key'] = process.env.BOSSU_API_KEY || '';
  return config;
});

// Helper to get formatted error
const getBossuError = (error: any) => {
  return error.response?.data || { message: error.message };
};

export const bossuPing = async () => {
  try {
    const response = await bossuClient.post('/api.php', { action: 'ping' });
    return response.data;
  } catch (error: any) {
    const err = getBossuError(error);
    console.error('Bossu Ping Error:', err);
    throw err;
  }
};

export const fetchBossuBalance = async () => {
  try {
    const response = await bossuClient.post('/api.php', { action: 'balance' });
    return response.data;
  } catch (error: any) {
    const err = getBossuError(error);
    console.error('Bossu Fetch Balance Error:', err);
    throw err;
  }
};

export const fetchBossuPackages = async (network: string) => {
  try {
    const response = await bossuClient.post('/api.php', { action: 'packages', network });
    return response.data;
  } catch (error: any) {
    const err = getBossuError(error);
    console.error('Bossu Fetch Packages Error:', err);
    throw err;
  }
};

export interface BossuOrderPayload {
  network: string;
  package_key: string;
  recipient_phone: string;
  external_reference?: string;
  callback_url?: string;
}

export const createBossuOrder = async (payload: BossuOrderPayload) => {
  try {
    const response = await bossuClient.post('/api.php', {
      action: 'create_order',
      ...payload,
    });
    return response.data;
  } catch (error: any) {
    const err = getBossuError(error);
    console.error('Bossu Create Order Error:', err);
    throw err;
  }
};

export const checkBossuOrderStatus = async (orderId: string) => {
  try {
    const response = await bossuClient.post('/api.php', {
      action: 'order_status',
      order_id: orderId,
    });
    return response.data;
  } catch (error: any) {
    const err = getBossuError(error);
    console.error('Bossu Check Order Status Error:', err);
    throw err;
  }
};
