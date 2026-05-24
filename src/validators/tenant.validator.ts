import { z } from "zod";

const updateTenantSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional()
})

export default updateTenantSchema;

export type UpdateTenantSchema = z.infer<typeof updateTenantSchema>;