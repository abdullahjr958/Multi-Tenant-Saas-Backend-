import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  slug: z
    .string()
    .min(1, { message: "Slug cannot be empty" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase and can contain hyphens",
    }),
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const loginSchema = z.object({
  email: z.email({
    message: "Invalid email address",
  }),

  password: z.string().min(1, {
    message: "Password cannot be empty",
  }),

  slug: z
    .string()
    .min(1, {
      message: "Slug cannot be empty",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase and can contain hyphens",
    }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
