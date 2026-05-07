import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import {
  getAllBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brand.controller.js';

const router = express.Router();

router.get('/', getAllBrands);
router.get('/:id', getBrand);
router.post('/', protect, adminOnly, createBrand);
router.put('/:id', protect, adminOnly, updateBrand);
router.delete('/:id', protect, adminOnly, deleteBrand);

export default router;