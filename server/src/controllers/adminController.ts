import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { generateUniqueOrderRef } from '../utils/orderRef';

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
