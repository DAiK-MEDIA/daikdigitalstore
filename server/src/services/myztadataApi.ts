import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const myZtaClient = axios.create({
  baseURL: 'https://myztadata.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

myZtaClient.interceptors.request.use((config) => {
  config.headers['x-api-key'] = process.env.MYZTADATA_API_KEY || '';
  return config;
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


export const buyOtherPackage = async (msisdn: string, networkId: number, sharedBundle: number, externalRef?: string, incomingRef?: string) => {
  try {
    const payload: any = {
      recipient_msisdn: msisdn,
      network_id: networkId,
      shared_bundle: sharedBundle,
    };
    
    if (externalRef) payload.external_api_ref = externalRef;
    if (incomingRef) payload.incoming_api_ref = incomingRef;

    const response = await myZtaClient.post('/buy-other-package', payload);
    return response.data;
  } catch (error: any) {
    const err = getMyZtaError(error);
    console.error('MyZtaData Buy Package Error:', err);
    throw err;
  }
};

export const fetchOtherNetworkTransaction = async (transactionId: string) => {
  try {
    const response = await myZtaClient.post('/fetch-other-network-transaction', {
      transaction_id: transactionId,
    });
    return response.data;
  } catch (error: any) {
    const err = getMyZtaError(error);
    console.error('MyZtaData Fetch Transaction Error:', err);
    throw err;
  }
};

