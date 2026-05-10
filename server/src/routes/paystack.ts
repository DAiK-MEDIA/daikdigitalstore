import { Router } from 'express';
import { initPayment, paystackWebhook } from '../controllers/paystackController';

const router = Router();

router.post('/initialize/:orderId', initPayment);
router.post('/webhook', paystackWebhook);

export default router;
