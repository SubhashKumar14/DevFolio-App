import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Need 1 uppercase letter')
    .regex(/[0-9]/, 'Need 1 number'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Max 50 characters'),
  role: z.enum(['developer', 'recruiter', 'mentor']),
});

export const platformHandleSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});