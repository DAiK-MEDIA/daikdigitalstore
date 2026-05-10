import { Router } from 'express';
import { createOrder, getOrderStatus } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/:orderRef/status', getOrderStatus);

export default router;
