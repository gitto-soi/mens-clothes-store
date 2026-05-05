import { z } from 'zod';

const orderItemSchema = z.object({
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().positive(),
});

export const validateOrder = (req, res, next) => {
  try {
    createOrderSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};