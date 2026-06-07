import { supabase } from './supabase';
import { placeDataOrder } from './getusApi';
import { buyOtherPackage } from './myztadataApi';
import { createBossuOrder } from './bossuApi';

export interface FulfillmentResult {
  fulfilled: boolean;
  apiSource: string;
  apiOrderId?: string;
  debugLog: string[];
  notificationMessage: string;
}

/**
 * Automatically places an order on the active source API (Bossu, MyZtaData, or GetUs).
 * Returns the fulfillment details and the appropriate admin notification message.
 */
export const autoFulfillOrder = async (
  order: any,
  isManualApproval: boolean = false
): Promise<FulfillmentResult> => {
  const result: FulfillmentResult = {
    fulfilled: false,
    apiSource: '',
    debugLog: [],
    notificationMessage: ''
  };

  const prefix = isManualApproval ? 'Manual Approval: ' : '';
  const failPrefix = isManualApproval ? 'Failed to Auto-Fulfill!' : 'Auto-Fulfillment Failed!';

  if (!order.data_plans) {
    const msg = 'No data plan associated with order';
    result.debugLog.push(msg);
    result.notificationMessage = `${failPrefix} Errors: ${msg}`;
    return result;
  }

  // 1. Fetch API Switch states
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('key, value')
    .in('key', ['auto_fulfill_api', 'auto_fulfill_api_myztadata', 'auto_fulfill_api_bossudata']);

  const settingsMap = settings?.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {}) || {};

  const isGetUsEnabled = settingsMap['auto_fulfill_api'] === 'true';
  const isMyZtaDataEnabled = settingsMap['auto_fulfill_api_myztadata'] === 'true';
  const isBossuDataEnabled = settingsMap['auto_fulfill_api_bossudata'] === 'true';

  if (!isGetUsEnabled && !isMyZtaDataEnabled && !isBossuDataEnabled) {
    const msg = 'No auto-fulfillment API is enabled';
    result.debugLog.push(msg);
    result.notificationMessage = `${failPrefix} Errors: ${msg}`;
    return result;
  }

  // 2. Extract package size in GB
  const rawGb = order.data_plans.size_gb;
  const packageGb = typeof rawGb === 'number' ? rawGb : parseFloat(order.data_plans.size_label?.replace(/[^0-9.]/g, '') || '0');

  if (isNaN(packageGb) || packageGb <= 0) {
    const msg = 'Invalid package size (0 or NaN)';
    result.debugLog.push(msg);
    result.notificationMessage = `${failPrefix} Errors: ${msg}`;
    return result;
  }

  // 3. Determine network from size_label
  let network = 'MTN';
  const label = (order.data_plans.size_label || '').toUpperCase();
  if (label.includes('TELECEL')) {
    network = 'Telecel';
  } else if (label.includes('AIRTELTIGO') || label.includes('AT')) {
    network = 'AirtelTigo';
  }

  // A. Try Bossu Data Hub first if enabled
  if (isBossuDataEnabled) {
    try {
      let bossuNetwork = 'mtn';
      if (network === 'Telecel') bossuNetwork = 'telecel';
      else if (network === 'AirtelTigo') bossuNetwork = 'at';

      console.log(`[Auto-Fulfill] Attempting BossuDataHub for ${order.order_ref}: ${packageGb}GB on network ${bossuNetwork}`);
      const bossuRes = await createBossuOrder({
        network: bossuNetwork,
        package_key: `${packageGb}gb`, // e.g., '1gb'
        recipient_phone: order.phone_number,
        external_reference: `${order.order_ref}_${Date.now()}`
      });

      if (bossuRes.status === 'success' || bossuRes.order_id) {
        result.fulfilled = true;
        result.apiSource = 'bossudata';
        result.apiOrderId = String(bossuRes.order_id || bossuRes.transaction_id);
        console.log(`[Auto-Fulfill] BossuDataHub success for ${order.order_ref}: ${result.apiOrderId}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      result.debugLog.push(`Bossu: ${errorMsg}`);
      console.error(`[Auto-Fulfill] BossuDataHub failed for ${order.order_ref}:`, err);
    }
  }

  // B. Try MyZtaData next if enabled and not yet fulfilled
  if (!result.fulfilled && isMyZtaDataEnabled) {
    try {
      let myZtaNetworkId = 3; // MTN
      if (network === 'Telecel') myZtaNetworkId = 2;
      else if (network === 'AirtelTigo') myZtaNetworkId = 1;

      const sharedBundle = packageGb * 1000;
      console.log(`[Auto-Fulfill] Attempting MyZtaData for ${order.order_ref}: ${packageGb}GB (${sharedBundle}MB) on network ID ${myZtaNetworkId}`);
      
      const myZtaRes = await buyOtherPackage(order.phone_number, myZtaNetworkId, sharedBundle, `${order.order_ref}_${Date.now()}`);
      
      if (myZtaRes.success) {
        result.fulfilled = true;
        result.apiSource = 'myztadata';
        result.apiOrderId = String(myZtaRes.transaction_code);
        console.log(`[Auto-Fulfill] MyZtaData success for ${order.order_ref}: ${result.apiOrderId}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      result.debugLog.push(`MyZtaData: ${errorMsg}`);
      console.error(`[Auto-Fulfill] MyZtaData failed for ${order.order_ref}:`, err);
    }
  }

  // C. Fallback to GetUs if enabled and not yet fulfilled
  if (!result.fulfilled && isGetUsEnabled) {
    try {
      console.log(`[Auto-Fulfill] Attempting GetUs for ${order.order_ref}: ${packageGb}GB on network ${network}`);
      const getusRes = await placeDataOrder(network, packageGb, order.phone_number);
      
      if (getusRes.status === 'success') {
        result.fulfilled = true;
        result.apiSource = 'getus';
        result.apiOrderId = String(getusRes.order_id);
        console.log(`[Auto-Fulfill] GetUs success for ${order.order_ref}: ${result.apiOrderId}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      result.debugLog.push(`GetUs: ${errorMsg}`);
      console.error(`[Auto-Fulfill] GetUs failed for ${order.order_ref}:`, err);
    }
  }

  // 4. Construct final notification message
  if (result.fulfilled) {
    const skipped = result.debugLog.length > 0 ? ` (Skipped: ${result.debugLog.join(', ')})` : '';
    result.notificationMessage = `${prefix}Fulfilled via ${result.apiSource}. API ID: ${result.apiOrderId}.${skipped}`;
  } else {
    result.notificationMessage = `${failPrefix} Errors: ${result.debugLog.join(' | ')}`;
  }

  return result;
};
