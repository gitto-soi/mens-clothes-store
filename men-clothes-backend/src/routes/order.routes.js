import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';
import {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
  getAllOrdersAdmin,   // ✅ import the new controller
} from '../controllers/order.controller.js';


const router = express.Router();

// All order routes require authentication
router.use(protect);

// User routes
router.post('/', createOrder);
router.get('/me', getMyOrders);
router.get('/:id', getOrder);
router.delete('/:id', deleteOrder);
router.patch('/:id/cancel', cancelOrder);

// Admin only routes
router.patch('/:id/status', adminOnly, updateOrderStatus);
router.get('/admin/all', protect, adminOnly, getAllOrdersAdmin);

export default router;