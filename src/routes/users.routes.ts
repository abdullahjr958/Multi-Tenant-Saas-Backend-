import { Router } from "express";
import {
  getUsersController,
  getUserByIdController,
  updateUserRoleController,
  deleteUserController,
} from "../controllers/users.controller";
import authMiddleware from "../middleware/auth.middleware";
import requireRole from "../middleware/rbac.middleware";
import { reqBodyValidator } from "../middleware/req-validator.middleware";
import { updateUserRoleSchema } from "../validators/users.validator";

const router = Router();

router.get("/users", authMiddleware, getUsersController);
router.get("/users/:id", authMiddleware, getUserByIdController);
router.patch("/users/:id/role", authMiddleware, requireRole("ADMIN"), reqBodyValidator(updateUserRoleSchema), updateUserRoleController);
router.delete("/users/:id", authMiddleware, requireRole("ADMIN"), deleteUserController);

export default router;