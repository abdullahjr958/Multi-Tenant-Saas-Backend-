"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutController = exports.refreshTokenController = exports.loginController = exports.signupController = void 0;
const auth_service_1 = require("../service/auth.service");
const auth_validator_1 = require("../validators/auth.validator");
const zod_1 = require("zod");
const signupController = async (req, res) => {
    try {
        const result = auth_validator_1.signupSchema.safeParse(req.body);
        if (!result.success)
            return res.status(400).send({ errors: zod_1.z.flattenError(result.error) });
        const { name, slug, email, password } = result.data;
        const { accessToken, refreshToken } = await (0, auth_service_1.signupService)(name, slug, email, password);
        return res
            .status(201)
            .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
            .send({ accessToken });
    }
    catch (error) {
        if (error instanceof Error)
            res.status(400).send({ error: error.message });
        else
            res.status(500).send({ error: "Internal Server Error" });
    }
};
exports.signupController = signupController;
const loginController = async (req, res) => {
    try {
        const result = auth_validator_1.loginSchema.safeParse(req.body);
        if (!result.success)
            return res.status(400).send({ errors: zod_1.z.flattenError(result.error) });
        const { email, password, slug } = result.data;
        const { accessToken, refreshToken } = await (0, auth_service_1.loginService)(email, password, slug);
        return res
            .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
            .send({ accessToken });
    }
    catch (error) {
        if (error instanceof Error)
            res.status(400).send({ error: error.message });
        else
            res.status(500).send({ error: "Internal Server Error" });
    }
};
exports.loginController = loginController;
const refreshTokenController = async (req, res) => {
    try {
        let { refreshToken } = req.cookies;
        if (!refreshToken)
            return res.status(400).json({ message: "No refresh token provided" });
        const { newRefreshToken, accessToken } = await (0, auth_service_1.refreshTokenService)(refreshToken);
        return res
            .cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
            .json({ accessToken });
    }
    catch (error) {
        if (error instanceof Error)
            res.status(400).send({ error: error.message });
        else
            res.status(500).send({ error: "Internal Server Error" });
    }
};
exports.refreshTokenController = refreshTokenController;
const logoutController = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken)
            return res.status(400).json({ message: "No refresh token provided" });
        await (0, auth_service_1.logoutService)(refreshToken);
        return res
            .status(200)
            .clearCookie("refreshToken")
            .send({ message: "Logged out successfully" });
    }
    catch (error) {
        if (error instanceof Error)
            res.status(400).send({ error: error.message });
        else
            res.status(500).send({ error: "Internal Server Error" });
    }
};
exports.logoutController = logoutController;
//# sourceMappingURL=auth.controller.js.map