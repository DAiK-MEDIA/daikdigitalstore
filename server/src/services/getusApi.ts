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

export const placeDataOrder = async (network: string, packageGb: number, recipient: string) => {
  try {
    const response = await getusClient.post('/order', {
      network,
      package_gb: packageGb,
      recipient,
    });
    return response.data;
  } catch (error: any) {
    console.error('GetUs Place Order Error:', error.response?.data || error.message);
    throw error;
  }
};

export const checkOrderStatus = async (orderId: string | number) => {
  try {
    const response = await getusClient.get(`/order-status?order_id=${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error('GetUs Check Status Error:', error.response?.data || error.message);
    throw error;
  }
};
