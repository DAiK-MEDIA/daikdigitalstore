import { Router } from 'express';
import { 
  getAllOrders, 
  updateOrderStatus, 
  updateOrderNotification, 
  createManualOrder,
  deleteOrder,
  approveManualPayment,
  managePlans,
  getSettings,
  updateSettings
} from '../controllers/adminController';
import { adminAuth } from '../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(adminAuth);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/notification', updateOrderNotification);
router.patch('/orders/:id/approve', approveManualPayment);
router.post('/orders/manual', createManualOrder);
router.delete('/orders/:id', deleteOrder);

// Plans
router.post('/plans', managePlans.create);
router.patch('/plans/:id', managePlans.update);
router.delete('/plans/:id', managePlans.delete);

// Settings
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;
