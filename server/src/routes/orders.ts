import { Router } from 'express';
import { createOrder, getOrderById, getOrderStatus, getPublicSettings, updatePaymentMethod } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/id/:orderId', getOrderById);
router.get('/:orderRef/status', getOrderStatus);
router.get('/settings/public', getPublicSettings);
router.patch('/:orderId/payment-method', updatePaymentMethod);

export default router;
