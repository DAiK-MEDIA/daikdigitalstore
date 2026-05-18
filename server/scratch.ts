import axios from 'axios';

const myZtaClient = axios.create({
  baseURL: 'https://myztadata.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': '600f86be620159c2a35694a62bd0acfb62b16a27'
  },
});

async function test() {
  try {
    const payload = {
      recipient_msisdn: '0241234567',
      network_id: 3,
      shared_bundle: 1000,
      external_api_ref: 'test_order_' + Date.now()
    };
    console.log('Sending payload:', payload);
    const res = await myZtaClient.post('/buy-other-package', payload);
    console.log('Success:', res.data);
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
