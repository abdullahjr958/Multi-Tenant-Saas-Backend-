import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    tenant: { create: vi.fn(), findUnique: vi.fn() },
    user: { create: vi.fn(), findUnique: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../service/audit.service", () => ({
  createAuditLog: vi.fn().mockResolvedValue({}),
}));

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  process.env.JWT_ACCESS_EXPIRES_IN_MINUTES = "15";
  process.env.JWT_REFRESH_EXPIRES_IN_DAYS = "7";
});

describe("POST /auth/signup", () => {
  it("should return 400 if request body is invalid", async () => {
    const res = await request(app).post("/auth/signup").send({ name: "Acme" });

    expect(res.status).toBe(400);
  });

  it("should return 409 if slug already exists", async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue({
      id: "1",
      slug: "acme",
    });

    const res = await request(app).post("/auth/signup").send({
      name: "Acme",
      slug: "acme",
      email: "user@acme.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
  });

  it("should return 201 and accessToken on successful signup", async () => {
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

    const res = await request(app).post("/auth/signup").send({
      name: "Acme",
      slug: "acme",
      email: "user@acme.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("should set refreshToken as httpOnly cookie on signup", async () => {
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

    const res = await request(app).post("/auth/signup").send({
      name: "Acme",
      slug: "acme",
      email: "user@acme.com",
      password: "password123",
    });

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"]![0]).toContain("refreshToken");
    expect(res.headers["set-cookie"]![0]).toContain("HttpOnly");
  });
});

describe("POST /auth/login", () => {
  it("should return 400 if request body is invalid", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@acme" });

    expect(res.status).toBe(400);
  });

  it("should return 401 if tenant not found", async () => {
    (prisma.tenant.findUnique as any).mockImplementation(null);

    const res = await request(app)
      .post("/auth/login")
      .send({
        name: "Acme",
        slug: "acme",
        email: "user@acme.com",
        password: "password123",
      });

    expect(res.status).toBe(401);
  });

  it("should return 401 if password is incorrect", async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue({ id: "tenant-1", slug: "acme" });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-1",
      email: "user@acme.com",
      role: "ADMIN",
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const res = await request(app).post("/auth/login").send({
      name: "Acme",
      slug: "acme",
      email: "user@acme.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });

  it("should return accessToken on successful login", async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue({ id: "tenant-1", slug: "acme" });
    (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        name: "Acme",
        email: "user@acme.com",
        role: "ADMIN",
      });
    (bcrypt.compare as any).mockResolvedValue(true);
    (jwt.sign as any).mockReturnValue("fake-token");
    (prisma.refreshToken.create as any).mockResolvedValue({});

    const res = await request(app).post("/auth/login").send({
      name: "Acme",
      slug: "acme",
      email: "user@acme.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  })

  it("should set refreshToken as httpOnly cookie on login", async () => {
    (prisma.tenant.findUnique as any).mockResolvedValue({ id: "tenant-1", slug: "acme" });
    (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        name: "Acme",
        email: "user@acme.com",
        role: "ADMIN",
      });
    (bcrypt.compare as any).mockResolvedValue(true);
    (jwt.sign as any).mockReturnValue("fake-token");
    (prisma.refreshToken.create as any).mockResolvedValue({});

    const res = await request(app).post("/auth/login").send({
      name: "Acme",
      slug: "acme",
      email: "user@acme.com",
      password: "password123",
    });

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"]![0]).toContain("refreshToken");
    expect(res.headers["set-cookie"]![0]).toContain("HttpOnly");
  })
});

describe("POST /auth/refresh-token", () => {
  it("should return 400 if no refresh token cookie", async () => {
    const res = await request(app).post("/auth/refresh-token");
    expect(res.status).toBe(400);
  });

  it("should return 401 if refresh token is invalid", async () => {
    (jwt.verify as any).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const res = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", "refreshToken=invalid-token");

    expect(res.status).toBe(401);
  });

  it("should return 200 and new accessToken on valid refresh", async () => {
    (jwt.verify as any).mockReturnValue({ userId: "user-1", tenantId: "tenant-1", role: "ADMIN" });
    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      token: "valid-token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    (prisma.refreshToken.delete as any).mockResolvedValue({});
    (prisma.refreshToken.create as any).mockResolvedValue({});
    (jwt.sign as any).mockReturnValue("new-fake-token");

    const res = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", "refreshToken=valid-token");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("should set new refreshToken cookie on valid refresh", async () => {
    (jwt.verify as any).mockReturnValue({ userId: "user-1", tenantId: "tenant-1", role: "ADMIN" });
    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      token: "valid-token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    (prisma.refreshToken.delete as any).mockResolvedValue({});
    (prisma.refreshToken.create as any).mockResolvedValue({});
    (jwt.sign as any).mockReturnValue("new-fake-token");

    const res = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", "refreshToken=valid-token");

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"]![0]).toContain("refreshToken");
  });
});

describe("POST /auth/logout", () => {
  it("should return 400 if no refresh token cookie", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(400);
  });

  it("should return 200 and clear cookie on successful logout", async () => {
    (prisma.refreshToken.delete as any).mockResolvedValue({});

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", "refreshToken=valid-token");

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]![0]).toContain("refreshToken=;");
  });
});