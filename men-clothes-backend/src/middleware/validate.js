import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.errors 
    });
  }
};

// Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[0-9]{8,15}$/, 'Phone must be 8-15 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
  name: z.string().optional(),
}).refine((data) => data.password == data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is requrired'),
  password: z.string().min(1, 'Password is required'),
});