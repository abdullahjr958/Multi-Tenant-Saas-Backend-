import { Router } from "express";
import { signupController, loginController, refreshTokenController, logoutController } from "../controllers/auth.controller";
import { signupSchema, loginSchema } from "../validators/auth.validator";
import { reqBodyValidator } from "../middleware/req-validator.middleware";

const router = Router();

router.post("/signup", reqBodyValidator(signupSchema), signupController);
router.post("/login", reqBodyValidator(loginSchema), loginController);

router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutController);

export default router;