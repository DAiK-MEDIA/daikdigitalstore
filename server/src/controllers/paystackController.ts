import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { initializeTransaction, verifyTransaction } from '../services/paystack';
import crypto from 'crypto';

export const initPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { email } = req.body; // Paystack requires an email

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, data_plans(size_label)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add Paystack fee (1.95%) so the merchant receives the exact amount
    const fee = order.amount_paid * 0.0195;
    const totalAmount = order.amount_paid + fee;
    const uniqueReference = `${order.order_ref}_${Date.now()}`;

    const paystackData = await initializeTransaction(
      email || 'customer@example.com', // Fallback if no email
      totalAmount,
      uniqueReference
    );

    res.json(paystackData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash === req.headers['x-paystack-signature']) {
      const event = req.body;
      
      if (event.event === 'charge.success') {
        const fullReference = event.data.reference;
        const reference = fullReference.split('_')[0]; // Extract the original order_ref
        
        // Update order status in Supabase
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            payment_method: 'paystack'
          })
          .eq('order_ref', reference);

        if (error) console.error('Webhook DB update error:', error);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};
