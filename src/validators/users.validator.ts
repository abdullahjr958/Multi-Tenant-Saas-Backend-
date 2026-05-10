import { z } from "zod";

export const updateUserRoleSchema = z.object({
    role: z.enum([ "ADMIN", "MANAGER", "MEMBER" ]),
})

export type UpdateUserRoleSchema = z.infer<typeof updateUserRoleSchema>;