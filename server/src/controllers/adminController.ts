import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { generateUniqueOrderRef } from '../utils/orderRef';
import { placeDataOrder } from '../services/getusApi';
import { buyOtherPackage } from '../services/myztadataApi';

// --- Orders ---

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, data_plans(size_label)')
      .order('created_at', { ascending: false });

    if (error) throw error;
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
      .select('*, data_plans(size_label)')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Prepare updates
    let updates: any = {
      payment_status: 'paid',
      payment_method: 'momo'
    };

    // 3. Check if Auto-Fulfillment is enabled
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['auto_fulfill_api', 'auto_fulfill_api_myztadata']);
      
    const settingsMap = settings?.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {}) || {};

    const isGetUsEnabled = settingsMap['auto_fulfill_api'] === 'true';
    const isMyZtaDataEnabled = settingsMap['auto_fulfill_api_myztadata'] === 'true';

    if ((isGetUsEnabled || isMyZtaDataEnabled) && order.data_plans?.size_label) {
      try {
        const packageGb = parseFloat(order.data_plans.size_label);
        
        if (!isNaN(packageGb)) {
          let fulfilled = false;

          // Try MyZtaData first if enabled
          if (isMyZtaDataEnabled) {
            try {
              // MTN network_id is typically 3, but you can adjust based on your networks table.
              // We'll pass packageGb * 1000 since MyZtaData volume is in MB (see docs).
              const myZtaRes = await buyOtherPackage(order.phone_number, 3, packageGb * 1000, order.order_ref);
              if (myZtaRes.success) {
                updates.order_status = 'processing';
                updates.api_order_id = String(myZtaRes.transaction_code);
                fulfilled = true;
              }
            } catch (err: any) {
              console.error('MyZtaData auto-fulfillment failed:', err?.response?.data || err.message);
            }
          }

          // Fallback to GetUs if MyZtaData failed or wasn't enabled, and GetUs is enabled
          if (!fulfilled && isGetUsEnabled) {
            try {
              const getusRes = await placeDataOrder('MTN', packageGb, order.phone_number);
              if (getusRes.status === 'success') {
                updates.order_status = 'processing';
                updates.api_order_id = String(getusRes.order_id);
                fulfilled = true;
              }
            } catch (err: any) {
              console.error('GetUs auto-fulfillment failed:', err?.response?.data || err.message);
            }
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
