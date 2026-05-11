import { Router } from 'express';
import { createOrder, getOrderStatus, updatePaymentMethod } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/:orderRef/status', getOrderStatus);
router.patch('/:orderId/payment-method', updatePaymentMethod);

export default router;
