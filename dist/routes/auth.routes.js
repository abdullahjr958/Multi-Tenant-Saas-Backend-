"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_validator_1 = require("../validators/auth.validator");
const req_validator_middleware_1 = require("../middleware/req-validator.middleware");
const router = (0, express_1.Router)();
router.post("/signup", (0, req_validator_middleware_1.reqBodyValidator)(auth_validator_1.signupSchema), auth_controller_1.signupController);
router.post("/login", (0, req_validator_middleware_1.reqBodyValidator)(auth_validator_1.loginSchema), auth_controller_1.loginController);
router.post("/refresh-token", auth_controller_1.refreshTokenController);
router.post("/logout", auth_controller_1.logoutController);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map