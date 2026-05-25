import { z } from "zod";

export const updateUserRoleSchema = z.object({
    role: z.enum([ "ADMIN", "MANAGER", "MEMBER" ]),
})

export const getUsersQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    role: z.enum([ "ADMIN", "MANAGER", "MEMBER" ]).optional(),
    email: z.email().optional(),
})

export type UpdateUserRoleSchema = z.infer<typeof updateUserRoleSchema>;

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;