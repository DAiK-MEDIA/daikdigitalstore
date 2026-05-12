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

// Helper to get formatted error
const getMyZtaError = (error: any) => {
  return error.response?.data || { message: error.message };
};


export const fetchNetworks = async () => {
  try {
    const response = await myZtaClient.get('/fetch-networks');
    return response.data;
  } catch (error: any) {
    const err = getMyZtaError(error);
    console.error('MyZtaData Fetch Networks Error:', err);
    throw err;
  }
};


export const fetchDataPackages = async () => {
  try {
    const response = await myZtaClient.get('/fetch-data-packages');
    return response.data;
  } catch (error: any) {
    const err = getMyZtaError(error);
    console.error('MyZtaData Fetch Packages Error:', err);
    throw err;
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
    const err = getMyZtaError(error);
    console.error('MyZtaData Buy Package Error:', err);
    throw err;
  }
};

