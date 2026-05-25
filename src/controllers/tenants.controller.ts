import { Request, Response, NextFunction } from "express";
import { getTenantByIdService, updateTenantService } from "../service/tenants.service";

const getTenantController = async (req: Request, res: Response, next: NextFunction) => {
    const { tenantId } = req.user!;
    if(!tenantId || typeof tenantId !== "string") 
        next(new Error("Tenant ID not found"));

    const tenant = await getTenantByIdService(tenantId);
    return res.status(200).json(tenant);
}

const updateTenantController = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const { name, slug } = req.body;

    if(!id || typeof id !== "string") 
        next(new Error("id params not found"));
    if(!name || typeof name !== "string") 
        next(new Error("name not found"));

    const tenant = await updateTenantService(id, name, slug);
    return res.status(200).json(tenant);
}

export { getTenantController, updateTenantController };