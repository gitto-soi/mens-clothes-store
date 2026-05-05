import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validateProduct } from '../middleware/validateProduct.js';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  createCategory,   // ✅ add this
  createBrand,      // ✅ add this
} from '../controllers/product.controller.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/:id', getProduct);

// ========== ADMIN ONLY ROUTES ==========
// Product CRUD
router.post('/', protect, adminOnly, upload.array('images', 5), validateProduct, createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Category & Brand management
router.post('/categories', protect, adminOnly, createCategory);
router.post('/brands', protect, adminOnly, createBrand);

export default router;