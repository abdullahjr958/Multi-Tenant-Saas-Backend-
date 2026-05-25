import { Request, Response, NextFunction } from "express";
import {
  getTenantByIdService,
  updateTenantService,
} from "../service/tenants.service";
import AppError from "../lib/AppError";

const getTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tenantId } = req.user!;
    if (!tenantId || typeof tenantId !== "string")
      throw new AppError("Tenant ID not found", 401);

    const tenant = await getTenantByIdService(tenantId);
    return res.status(200).json(tenant);
  } catch (error) {
    next(error);
  }
};

const updateTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tenantId } = req.user!;
    const { name, slug } = req.body;

    if (!tenantId || typeof tenantId !== "string")
      throw new AppError("Tenant ID not found", 401);
    if (!name || typeof name !== "string")
      throw new AppError("name not found", 401);
    if (!slug || typeof slug !== "string")
      throw new AppError("slug not found", 401);

    const tenant = await updateTenantService(tenantId, name, slug);
    return res.status(200).json(tenant);
  } catch (error) {
    next(error);
  }
};

export { getTenantController, updateTenantController };
