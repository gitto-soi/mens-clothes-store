import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;