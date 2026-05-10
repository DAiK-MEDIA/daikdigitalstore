import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { generateUniqueOrderRef } from '../utils/orderRef';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { full_name, phone_number, plan_id, user_type } = req.body;

    if (!full_name || !phone_number || !plan_id || !user_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get plan details to confirm amount
    const { data: plan, error: planError } = await supabase
      .from('data_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const amount = user_type === 'agent' ? plan.agent_price : plan.client_price;
    const orderRef = await generateUniqueOrderRef();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_ref: orderRef,
        user_type,
        full_name,
        phone_number,
        plan_id,
        amount_paid: amount,
        payment_status: 'unpaid',
        order_status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderRef } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_ref,
        full_name,
        created_at,
        phone_number,
        amount_paid,
        order_status,
        notification_message,
        data_plans (
          size_label
        )
      `)
      .eq('order_ref', orderRef)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Mask phone number as per PRD (e.g. 059****123)
    const phone = data.phone_number;
    const maskedPhone = phone.length > 6 
      ? `${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}`
      : '***';

    res.json({
      ...data,
      phone_number: maskedPhone,
    });
  } catch (error: any) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
};
