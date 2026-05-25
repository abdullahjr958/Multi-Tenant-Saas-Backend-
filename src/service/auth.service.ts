import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import envVarsVerifier from "../utils/envVarsVerfier";
import { createAuditLog } from "./audit.service";
import AppError from "../lib/AppError";

type SignupResult = { accessToken: string; refreshToken: string };
const signupService = async (
  name: string,
  slug: string,
  email: string,
  password: string,
): Promise<SignupResult> => {
  envVarsVerifier();

  const checkExistingSlug = await prisma.tenant.findUnique({
    where: { slug },
  });
  if (checkExistingSlug) throw new AppError("Slug already exists", 409);

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create tenant and user in a transaction to ensure atomicity
  const { tenant, user } = await prisma.$transaction(async (tx) => {
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

const loginService = async (email: string, password: string, slug: string) => {
  envVarsVerifier();
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new AppError("Invalid Credentials", 401);

  const user = await prisma.user.findUnique({
    where: { email_tenantId: { email, tenantId: tenant.id } },
  });

  const isPasswordValid =
    user && (await bcrypt.compare(password, user.password));
  if (!user || !isPasswordValid) throw new AppError("Invalid Credentials", 401);

  const accessToken = generateAccessToken(user.id, tenant.id, user.role);
  const refreshToken = generateRefreshToken(user.id, tenant.id, user.role);

  await createRefreshToken(refreshToken, user.id, tenant.id);
  createAuditLog("USER_LOGIN", "User", user.id, user.id, tenant.id).catch(err => console.error(`Failed to create audit log: ${err.message}`));
  return { accessToken, refreshToken };
};

const refreshTokenService = async (refreshToken: string) => {
  envVarsVerifier();
  let payload;
  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    ) as { userId: string; tenantId: string; role: Role };
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }

  const refreshTokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  // If token not found or expired, throw error
  if (!refreshTokenRecord) throw new AppError("Refresh token not found", 401);
  if (refreshTokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    throw new AppError("Refresh token expired", 401);
  }

  // Delete old token and create and return new one
  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  const newRefreshToken = generateRefreshToken(
    payload.userId,
    payload.tenantId,
    payload.role,
  );

  await createRefreshToken(newRefreshToken, payload.userId, payload.tenantId);

  const accessToken = generateAccessToken(
    payload.userId,
    payload.tenantId,
    payload.role,
  );

  return { newRefreshToken, accessToken };
};

const logoutService = async (refreshToken: string) => {
  if (!refreshToken) throw new AppError("Refresh token is required for logout", 401);
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  return true;
};

function generateAccessToken(userId: string, tenantId: string, role: Role) {
  const secret = process.env.JWT_ACCESS_SECRET || "";
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN_MINUTES;

  const accessToken = jwt.sign({ userId, tenantId, role }, secret, {
    expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]>,
  });
  return accessToken;
}

function generateRefreshToken(userId: string, tenantId: string, role: Role) {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || "7");

  return jwt.sign({ userId, tenantId, role }, secret, {
    expiresIn: days * 24 * 60 * 60, // days → seconds
  });
}

const createRefreshToken = async (
  token: string,
  userId: string,
  tenantId: string,
) => {
  const expiresAt = getRefreshTokenExpiry();
  return await prisma.refreshToken.create({
    data: { token, userId, tenantId, expiresAt },
  });
};

const getRefreshTokenExpiry = () => {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || "7");
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export { signupService, loginService, refreshTokenService, logoutService };
