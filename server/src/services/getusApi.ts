import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const getusClient = axios.create({
  baseURL: 'https://getus.site/wp-json/ddm/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.GETUS_API_KEY || '',
  },
});

// Helper to get formatted error
const getGetUsError = (error: any) => {
  return error.response?.data || { message: error.message };
};

export const placeDataOrder = async (network: string, packageGb: number, recipient: string) => {
  try {
    const response = await getusClient.post('/order', {
      network,
      package_gb: packageGb,
      recipient,
    });
    return response.data;
  } catch (error: any) {
    const err = getGetUsError(error);
    console.error('GetUs Place Order Error:', err);
    throw err;
  }
};

export const checkOrderStatus = async (orderId: string | number) => {
  try {
    const response = await getusClient.get(`/order-status?order_id=${orderId}`);
    return response.data;
  } catch (error: any) {
    const err = getGetUsError(error);
    console.error('GetUs Check Status Error:', err);
    throw err;
  }
};

