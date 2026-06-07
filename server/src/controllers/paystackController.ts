import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { initializeTransaction, verifyTransaction } from '../services/paystack';
import { autoFulfillOrder } from '../services/fulfillment';
import crypto from 'crypto';

export const initPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;


    const { data: order, error } = await supabase
      .from('orders')
      .select('*, data_plans(size_label)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data: settings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'paystack_enabled')
      .single();

    if (settings && settings.value === 'false') {
      return res.status(400).json({ error: 'Pay online option is currently disabled. Please use the manual MoMo transfer option.' });
    }

    // Ensure amount_paid is treated as a number to prevent string concatenation
    const baseAmount = Number(order.amount_paid);
    // Add Paystack fee (1.95%) so the merchant receives the exact amount
    const fee = baseAmount * 0.0195;
    const totalAmount = baseAmount + fee;
    const uniqueReference = `${order.order_ref}_${Date.now()}`;

    const paystackData = await initializeTransaction(
      'noreply@yourdomain.com',
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

    // req.body is a raw Buffer (express.raw middleware) — use it directly for HMAC
    // This ensures the signature matches exactly what Paystack signed
    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    console.log(`[Paystack Webhook] Received. Sig match: ${hash === req.headers['x-paystack-signature']}`);

    if (hash === req.headers['x-paystack-signature']) {
      // Parse the raw buffer into a JSON event object
      const event = JSON.parse(rawBody.toString());

      if (event.event === 'charge.success') {
        const fullReference = event.data.reference;
        const reference = fullReference.split('_')[0]; // Extract the original order_ref
        console.log(`[Paystack Webhook] charge.success for ref: ${fullReference} → order_ref: ${reference}`);

        // Fetch order details
        const { data: order } = await supabase
          .from('orders')
          .select('*, data_plans(size_label, size_gb)')
          .eq('order_ref', reference)
          .single();

        if (order) {
          console.log(`[Paystack Webhook] Order found: ${order.id}. Updating to paid...`);
          let updates: any = {
            payment_status: 'paid',
            payment_method: 'paystack'
          };

          const fulfillment = await autoFulfillOrder(order, false);
          if (fulfillment.fulfilled) {
            updates.order_status = 'processing';
            updates.api_order_id = fulfillment.apiOrderId;
          }
          updates.notification_message = fulfillment.notificationMessage;


          // Update order status in Supabase
          const { error } = await supabase
            .from('orders')
            .update(updates)
            .eq('order_ref', reference);

          if (error) console.error('Webhook DB update error:', error);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};
