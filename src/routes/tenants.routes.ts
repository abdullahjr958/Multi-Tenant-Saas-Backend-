import { Router } from "express";
import {
  getTenantController,
  updateTenantController,
} from "../controllers/tenants.controller";
import authMiddleware from "../middleware/auth.middleware";
import requireRole from "../middleware/rbac.middleware";
import { reqBodyValidator } from "../middleware/req-validator.middleware";
import updateTenantSchema from "../validators/tenant.validator";

const router = Router();

router.get("/me", authMiddleware, getTenantController);
router.patch(
  "/me",
  authMiddleware,
  requireRole("ADMIN"),
  reqBodyValidator(updateTenantSchema),
  updateTenantController,
);
