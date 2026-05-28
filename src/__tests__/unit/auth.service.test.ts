import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { loginService, logoutService, refreshTokenService, signupService } from "../../service/auth.service";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createAuditLog } from "../../service/audit.service";
import { Prisma } from "@prisma/client";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    tenant: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../service/audit.service", () => ({
  createAuditLog: vi.fn().mockResolvedValue({}),
}));

// Set fake env variables before tests run
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  process.env.JWT_ACCESS_EXPIRES_IN_MINUTES = "15";
  process.env.JWT_REFRESH_EXPIRES_IN_DAYS = "7";
});

describe("Signup Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw if slug already exists", async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue({
      id: "1",
      slug: "taken",
    });

    await expect(
      signupService("Acme", "taken", "user@acme.com", "password123"),
    ).rejects.toThrow("Slug already exists");
  });

  it("should return accessToken and refreshToken on successful signup", async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue(null);
    (prisma.$transaction as any).mockImplementation(async (fn: any) =>
      fn({
        tenant: {
          create: vi.fn().mockResolvedValue({ id: "tenant-1", slug: "acme" }),
        },
        user: {
          create: vi.fn().mockResolvedValue({
            id: "user-1",
            email: "user@acme.com",
            role: "ADMIN",
          }),
        },
      }),
    );

    (bcrypt.hash as any).mockResolvedValue("hashedpassword");
    (jwt.sign as any).mockReturnValue("fake-token");
    (prisma.refreshToken.create as any).mockResolvedValue({});
    (createAuditLog as any).mockResolvedValue({});

    const result = await signupService(
      "Acme",
      "acme",
      "user@acme.com",
      "password123",
    );

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });

  it("should hash the password before storing", async() => {
    (prisma.tenant.findUnique as any).mockResolvedValue(null);
    (prisma.$transaction as any).mockImplementation(async (fn: any) => 
    fn({
        tenant: { create: vi.fn().mockResolvedValue({ id: "tenant-1", slug: "acme" }) },
        user: { create: vi.fn().mockResolvedValue({ id: "user-1", email: "user@acme.com", role: "ADMIN" }) },
    }));

    (bcrypt.hash as any).mockResolvedValue("hashedpassword");
    (jwt.sign as any).mockReturnValue("fake-token");
    (prisma.refreshToken.create as any).mockResolvedValue({});
    (createAuditLog as any).mockResolvedValue({});

    const result = await signupService("Acme", "acme", "user@acme.com", "password123");

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
  })
});

describe("Login Service", () => {

    it("should throw if tenant not found", async () => {
        (prisma.tenant.findUnique as any).mockResolvedValue(null);

        await expect(
            loginService("user@acme.com", "password123", "acme"),
        ).rejects.toThrow("Invalid Credentials");
    })

    it("should throw if user not found", async () => {
        (prisma.tenant.findUnique as any).mockResolvedValue({ id: "tenant-1", slug: "acme" });
        (prisma.user.findUnique as any).mockResolvedValue(null);
        (bcrypt.compare as any).mockResolvedValue(true);

        await expect(
            loginService("user@acme.com", "password123", "acme"),
        ).rejects.toThrow("Invalid Credentials");
    })

    it("should throw if password is invalid", async () => {
        (prisma.tenant.findUnique as any).mockResolvedValue({ id: "tenant-1", slug: "acme" });
        (prisma.user.findUnique as any).mockResolvedValue({ id: "user-1", email: "user@acme.com", role: "ADMIN" });
        (bcrypt.compare as any).mockResolvedValue(false);

        await expect(
            loginService("user@acme.com", "password123", "acme"),
        ).rejects.toThrow("Invalid Credentials");
    })

    it("should return accessToken and refreshToken on successful login", async () => {
        (prisma.tenant.findUnique as any).mockResolvedValue({ id: "tenant-1", slug: "acme" });
        (prisma.user.findUnique as any).mockResolvedValue({ id: "user-1", email: "user@acme.com", role: "ADMIN" });
        (bcrypt.compare as any).mockResolvedValue(true);

        (jwt.sign as any).mockReturnValue("fake-token");
        (prisma.refreshToken.create as any).mockResolvedValue({});
        (createAuditLog as any).mockResolvedValue({});

        const result = await loginService("user@acme.com", "password123", "acme");

        expect(result).toHaveProperty("accessToken");
        expect(result).toHaveProperty("refreshToken");
    })
})

describe("Refresh Token Service", () => {
    it("should throw if refresh token is invalid", async () => {
        (jwt.verify as any).mockImplementation(() => {
            throw new Error("Invalid token");
        })

        await expect(
            refreshTokenService("invalid-token"))
            .rejects.toThrow("Invalid refresh token");
    })

    it("should throw if refresh token not found in DB", async () => {
        (jwt.verify as any).mockReturnValue({ userId: "user-1", tenantId: "tenant-1", role: "ADMIN" });
        (prisma.refreshToken.findUnique as any).mockResolvedValue(null);

        await expect(
            refreshTokenService("valid-token"))
            .rejects.toThrow("Refresh token not found");
    })

    it("should throw if refresh token is expired", async () => {
        (jwt.verify as any).mockReturnValue({ userId: "user-1", tenantId: "tenant-1", role: "ADMIN" });
        (prisma.refreshToken.findUnique as any).mockResolvedValue({
            token: "old-token",
            expiresAt: new Date(Date.now() - 1000)
        });

        await expect(
            refreshTokenService("old-token"))
            .rejects.toThrow("Refresh token expired");
    })

    it("should return new access token and refresh token on valid refresh", async () => {
        (jwt.verify as any).mockReturnValue({ userId: "user-1", tenantId: "tenant-1", role: "ADMIN" });
        (prisma.refreshToken.findUnique as any).mockResolvedValue({
            token: "old-token",
            expiresAt: new Date(Date.now() + 1000)
        });

        (jwt.sign as any).mockReturnValue("fake-token");
        (prisma.refreshToken.create as any).mockResolvedValue({});
        (createAuditLog as any).mockResolvedValue({});

        const result = await refreshTokenService("old-token");

        expect(result).toHaveProperty("accessToken");
        expect(result).toHaveProperty("newRefreshToken");
    })
})

describe("Logout Service", () => {
    it("should delete refresh token and return true", async () => {
        (prisma.refreshToken.delete as any).mockResolvedValue({});

        const result = await logoutService("valid-token");
        expect(result).toBe(true);
    })

    it("should throw if error occurs during token deletion", async () => {
        (prisma.refreshToken.delete as any).mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Not found", { code: "P2025", clientVersion: "5.0.0" }))

        await expect(
            logoutService("valid-token"))
            .rejects.toThrow("Not found");
    })
})