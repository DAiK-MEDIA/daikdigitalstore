import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const myZtaClient = axios.create({
  baseURL: 'https://myztadata.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': process.env.MYZTADATA_API_KEY || '',
  },
});

export const fetchNetworks = async () => {
  try {
    const response = await myZtaClient.get('/fetch-networks');
    return response.data;
  } catch (error: any) {
    console.error('MyZtaData Fetch Networks Error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchDataPackages = async () => {
  try {
    const response = await myZtaClient.get('/fetch-data-packages');
    return response.data;
  } catch (error: any) {
    console.error('MyZtaData Fetch Packages Error:', error.response?.data || error.message);
    throw error;
  }
};

export const buyOtherPackage = async (msisdn: string, networkId: number, sharedBundle: number, externalRef?: string) => {
  try {
    const response = await myZtaClient.post('/buy-other-package', {
      recipient_msisdn: msisdn,
      network_id: networkId,
      shared_bundle: sharedBundle,
      external_api_ref: externalRef,
    });
    return response.data;
  } catch (error: any) {
    console.error('MyZtaData Buy Package Error:', error.response?.data || error.message);
    throw error;
  }
};
