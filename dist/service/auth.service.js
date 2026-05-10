"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutService = exports.refreshTokenService = exports.loginService = exports.signupService = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signupService = async (name, slug, email, password) => {
    const checkExistingSlug = await prisma_1.prisma.tenant.findUnique({
        where: { slug },
    });
    if (checkExistingSlug)
        throw new Error("Slug already exists");
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    // Create tenant and user in a transaction to ensure atomicity
    const { tenant, user } = await prisma_1.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
            data: { name, slug },
        });
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                role: "ADMIN",
                tenantId: tenant.id,
            },
        });
        return { tenant, user };
    });
    const accessToken = generateAccessToken(user.id, tenant.id, user.role);
    const refreshToken = generateRefreshToken(user.id, tenant.id, user.role);
    await createRefreshToken(refreshToken, user.id, tenant.id);
    return { accessToken, refreshToken };
};
exports.signupService = signupService;
const loginService = async (email, password, slug) => {
    const tenant = await prisma_1.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant)
        throw new Error("Invalid Credentials");
    const user = await prisma_1.prisma.user.findUnique({
        where: { email_tenantId: { email, tenantId: tenant.id } },
    });
    const isPasswordValid = user && (await bcrypt_1.default.compare(password, user.password));
    if (!user || !isPasswordValid)
        throw new Error("Invalid Credentials");
    const accessToken = generateAccessToken(user.id, tenant.id, user.role);
    const refreshToken = generateRefreshToken(user.id, tenant.id, user.role);
    await createRefreshToken(refreshToken, user.id, tenant.id);
    return { accessToken, refreshToken };
};
exports.loginService = loginService;
const refreshTokenService = async (refreshToken) => {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "");
    }
    catch (error) {
        throw new Error("Invalid refresh token");
    }
    const refreshTokenRecord = await prisma_1.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
    });
    // If token not found or expired, throw error
    if (!refreshTokenRecord)
        throw new Error("Refresh token not found");
    if (refreshTokenRecord.expiresAt < new Date()) {
        await prisma_1.prisma.refreshToken.delete({ where: { token: refreshToken } });
        throw new Error("Refresh token expired");
    }
    // Delete old token and create and return new one
    await prisma_1.prisma.refreshToken.delete({ where: { token: refreshToken } });
    const newRefreshToken = generateRefreshToken(payload.userId, payload.tenantId, payload.role);
    await createRefreshToken(newRefreshToken, payload.userId, payload.tenantId);
    const accessToken = generateAccessToken(payload.userId, payload.tenantId, payload.role);
    return { newRefreshToken, accessToken };
};
exports.refreshTokenService = refreshTokenService;
const logoutService = async (refreshToken) => {
    if (!refreshToken)
        throw new Error("Refresh token is required for logout");
    await prisma_1.prisma.refreshToken.delete({ where: { token: refreshToken } });
    return true;
};
exports.logoutService = logoutService;
const createRefreshToken = async (token, userId, tenantId) => {
    const expiresAt = getRefreshTokenExpiry();
    return await prisma_1.prisma.refreshToken.create({
        data: { token, userId, tenantId, expiresAt },
    });
};
const getRefreshTokenExpiry = () => {
    const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || "7");
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
function generateAccessToken(userId, tenantId, role) {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN_MINUTES;
    if (!secret || !expiresIn)
        throw new Error("JWT env variables are missing");
    const accessToken = jsonwebtoken_1.default.sign({ userId, tenantId, role }, secret, {
        expiresIn: expiresIn,
    });
    return accessToken;
}
function generateRefreshToken(userId, tenantId, role) {
    const secret = process.env.JWT_REFRESH_SECRET;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN;
    if (!secret || !expiresIn)
        throw new Error("JWT env variables are missing");
    const refreshToken = jsonwebtoken_1.default.sign({ userId, tenantId, role }, secret, {
        expiresIn: expiresIn,
    });
    return refreshToken;
}
//# sourceMappingURL=auth.service.js.map