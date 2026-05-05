import { z } from 'zod';

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
});

export const productCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().uuid('Invalid category ID'),
  brandId: z.string().uuid('Invalid brand ID'),
  variants: z.array(variantSchema).min(1, 'At least one variant required'),
});

export const validateProduct = (req, res, next) => {
  try {
    // Log for debugging
    console.log('Raw variants before parse:', req.body.variants);

    // If variants is missing
    if (!req.body.variants) {
      return res.status(400).json({ error: 'variants field is missing' });
    }

    // Handle different types
    let parsedVariants = null;

    if (typeof req.body.variants === 'string') {
      // If it's the broken "[object Object]" string
      if (req.body.variants === '[object Object]') {
        return res.status(400).json({ 
          error: 'Invalid variants format',
          message: 'The variants field must be a valid JSON string, not "[object Object]". Make sure the field type is "Text" in Postman form-data.'
        });
      }
      // Try to parse JSON string
      try {
        parsedVariants = JSON.parse(req.body.variants);
      } catch (e) {
        return res.status(400).json({ 
          error: 'Invalid JSON in variants', 
          details: e.message,
          received: req.body.variants 
        });
      }
    } else if (Array.isArray(req.body.variants)) {
      parsedVariants = req.body.variants;
    } else if (typeof req.body.variants === 'object') {
      // If it's an object but not array, wrap it
      parsedVariants = [req.body.variants];
    } else {
      return res.status(400).json({ error: 'variants must be a JSON array or string' });
    }

    // Ensure it's an array
    if (!Array.isArray(parsedVariants)) {
      return res.status(400).json({ error: 'variants must be an array' });
    }

    // Replace with parsed variants
    req.body.variants = parsedVariants;

    // Convert price to number
    if (req.body.price) req.body.price = parseFloat(req.body.price);

    // Validate with Zod
    productCreateSchema.parse(req.body);
    next();
  } catch (error) {
    console.error('Validation error:', error.errors);
    return res.status(400).json({ error: error.errors });
  }
};