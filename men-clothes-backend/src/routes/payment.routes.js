import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  initiatePayment,
  checkPaymentStatus,
  cancelPayment,
} from '../controllers/payment.controller.js';

const router = express.Router();

router.use(protect);

router.post('/initiate/:orderId', initiatePayment);
router.get('/status/:orderId', checkPaymentStatus);
router.delete('/cancel/:orderId', cancelPayment);

export default router;