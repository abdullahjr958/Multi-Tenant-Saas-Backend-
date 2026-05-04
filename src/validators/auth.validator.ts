import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(1, 'Name cannot be empty'),
    slug: z.string().min(1, 'Slug cannot be empty').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and can contain hyphens'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password cannot be empty'),
    slug: z.string().min(1, 'Slug cannot be empty').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and can contain hyphens'),
})

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;