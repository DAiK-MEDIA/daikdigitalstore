import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { generateUniqueOrderRef } from '../utils/orderRef';
import { placeDataOrder } from '../services/getusApi';
import { buyOtherPackage } from '../services/myztadataApi';
import { createBossuOrder } from '../services/bossuApi';

// --- Orders ---

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, data_plans(size_label)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Return all orders — the admin dashboard UI handles status display via badges.
    // Filtering here would hide Paystack orders if the webhook is delayed or fails.
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const updateOrderNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ notification_message: message })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

export const createManualOrder = async (req: Request, res: Response) => {
  try {
    const { full_name, phone_number, plan_id, user_type, amount_paid } = req.body;
    const orderRef = await generateUniqueOrderRef();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_ref: orderRef,
        user_type,
        full_name,
        phone_number,
        plan_id,
        amount_paid,
        payment_method: 'momo',
        payment_status: 'paid',
        order_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create manual order' });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

export const approveManualPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch order details
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, data_plans(size_label, size_gb)')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Prepare updates
    let updates: any = {
      payment_status: 'paid',
      payment_method: order.payment_method === 'paystack' ? 'paystack' : 'momo'
    };

    // 3. Check if Auto-Fulfillment is enabled
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

    if ((isGetUsEnabled || isMyZtaDataEnabled || isBossuDataEnabled) && order.data_plans) {
      try {
        // Extract size_gb cleanly or parse from label if not present
        const rawGb = order.data_plans.size_gb;
        const packageGb = typeof rawGb === 'number' ? rawGb : parseFloat(order.data_plans.size_label?.replace(/[^0-9.]/g, '') || '0');

        // Determine network from size_label
        let network = 'MTN';
        const label = (order.data_plans.size_label || '').toUpperCase();
        if (label.includes('TELECEL')) {
          network = 'Telecel';
        } else if (label.includes('AIRTELTIGO') || label.includes('AT')) {
          network = 'AirtelTigo';
        }
        
        if (!isNaN(packageGb) && packageGb > 0) {
          let fulfilled = false;
          let apiSource = '';
          let debugLog: string[] = [];

          // Try Bossu Data Hub first if enabled
          if (isBossuDataEnabled) {
            try {
              let bossuNetwork = 'mtn';
              if (network === 'Telecel') bossuNetwork = 'telecel';
              else if (network === 'AirtelTigo') bossuNetwork = 'at';

              console.log(`Manual Approval: Attempting BossuDataHub fulfillment for ${order.order_ref}: ${packageGb}GB on network ${bossuNetwork}`);
              const bossuRes = await createBossuOrder({
                network: bossuNetwork,
                package_key: `${packageGb}gb`,
                recipient_phone: order.phone_number,
                external_reference: `${order.order_ref}_${Date.now()}`
              });

              if (bossuRes.status === 'success' || bossuRes.order_id) {
                updates.order_status = 'processing';
                updates.api_order_id = String(bossuRes.order_id || bossuRes.transaction_id);
                apiSource = 'bossudata';
                fulfilled = true;
                console.log(`Manual Approval: BossuDataHub successful for ${order.order_ref}`);
              }
            } catch (err: any) {
              const errorMsg = err.message || JSON.stringify(err);
              debugLog.push(`Bossu: ${errorMsg}`);
              console.error(`Manual Approval: BossuDataHub failed for ${order.order_ref}:`, err);
            }
          }

          // Try MyZtaData next if enabled
          if (!fulfilled && isMyZtaDataEnabled) {
            try {
              // Map network string to MyZtaData network_id
              let myZtaNetworkId = 3; // MTN
              if (network === 'Telecel') myZtaNetworkId = 2;
              else if (network === 'AirtelTigo') myZtaNetworkId = 1;

              const sharedBundle = packageGb * 1000;
              console.log(`Manual Approval: Attempting MyZtaData fulfillment for ${order.order_ref}: ${packageGb}GB (${sharedBundle}MB) on network ID ${myZtaNetworkId}`);
              
              const myZtaRes = await buyOtherPackage(order.phone_number, myZtaNetworkId, sharedBundle, `${order.order_ref}_${Date.now()}`);
              
              if (myZtaRes.success) {
                updates.order_status = 'processing';
                updates.api_order_id = String(myZtaRes.transaction_code);
                apiSource = 'myztadata';
                fulfilled = true;
                console.log(`Manual Approval: MyZtaData successful for ${order.order_ref}`);
              }
            } catch (err: any) {
              const errorMsg = err.message || JSON.stringify(err);
              debugLog.push(`MyZtaData: ${errorMsg}`);
              console.error(`Manual Approval: MyZtaData failed for ${order.order_ref}:`, err);
            }
          }

          // Fallback to GetUs
          if (!fulfilled && isGetUsEnabled) {
            try {
              console.log(`Manual Approval: Attempting GetUs fulfillment for ${order.order_ref}: ${packageGb}GB on network: ${network}`);
              const getusRes = await placeDataOrder(network, packageGb, order.phone_number);
              
              if (getusRes.status === 'success') {
                updates.order_status = 'processing';
                updates.api_order_id = String(getusRes.order_id);
                apiSource = 'getus';
                fulfilled = true;
                console.log(`Manual Approval: GetUs successful for ${order.order_ref}`);
              }
            } catch (err: any) {
              const errorMsg = err.message || JSON.stringify(err);
              debugLog.push(`GetUs: ${errorMsg}`);
              console.error(`Manual Approval: GetUs failed for ${order.order_ref}:`, err);
            }
          }

          if (fulfilled) {
            updates.notification_message = `Manual Approval: Fulfilled via ${apiSource}. API ID: ${updates.api_order_id}. ${debugLog.length > 0 ? '(Skipped: ' + debugLog.join(', ') + ')' : ''}`;
          } else {
            updates.notification_message = `Failed to Auto-Fulfill! Errors: ${debugLog.join(' | ')}`;
          }
        }
      } catch (err) {
        console.error('Manual approval: Auto-fulfillment failed overall:', err);
      }
    }


    // 4. Update Database
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error approving payment:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
};

export const declineManualPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        order_status: 'cancelled',
        notification_message: 'Your payment was declined. Please contact support.'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error declining payment:', error);
    res.status(500).json({ error: 'Failed to decline payment' });
  }
};

// --- Plans ---

export const managePlans = {
  create: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase.from('data_plans').insert(req.body).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create plan' });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('data_plans').update(req.body).eq('id', id).select().single();
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update plan' });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('data_plans').delete().eq('id', id);
      if (error) throw error;
      res.json({ message: 'Plan deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete plan' });
    }
  }
};

// --- Settings ---

export const getSettings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('admin_settings').select('*');
    if (error) throw error;

    // Format as object
    const settings = data.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    for (let [key, value] of Object.entries(updates)) {
      // Skip empty password field (means "keep existing")
      if (key === 'agent_password_hash' && !value) continue;

      if (key === 'agent_password_hash' && value) {
        if (!(value as string).startsWith('$2')) {
          const bcrypt = require('bcrypt');
          value = await bcrypt.hash(value, 10);
        }
      }

      // Use upsert so new keys are created, existing keys are updated
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });

      if (error) throw error;
    }

    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
