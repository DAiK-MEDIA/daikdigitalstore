import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const getMyZtaHeaders = () => {
  const key = process.env.MYZTADATA_API_KEY || '';
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-api-key': key
  };
};

const myZtaClient = axios.create({
  baseURL: 'https://myztadata.com/api/v1',
});

// Helper to get formatted error
const getMyZtaError = (error: any) => {
  return error.response?.data || { message: error.message };
};


export const fetchNetworks = async () => {
  try {
    const response = await myZtaClient.get('/fetch-networks', { headers: getMyZtaHeaders() });
    return response.data;
  } catch (error: any) {
    const err = getMyZtaError(error);
    console.error('MyZtaData Fetch Networks Error:', err);
    throw err;
  }
};


export const fetchDataPackages = async () => {
  try {
    const response = await myZtaClient.get('/fetch-data-packages', { headers: getMyZtaHeaders() });
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

    const response = await myZtaClient.post('/buy-other-package', payload, { headers: getMyZtaHeaders() });
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
    }, { headers: getMyZtaHeaders() });
    return response.data;
  } catch (error: any) {
    const err = getMyZtaError(error);
    console.error('MyZtaData Fetch Transaction Error:', err);
    throw err;
  }
};

