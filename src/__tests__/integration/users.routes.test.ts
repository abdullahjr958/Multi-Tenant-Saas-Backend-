import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    refreshToken: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn().mockImplementation((queries) => {
      if (Array.isArray(queries)) {
        return Promise.all(queries);
      }
      return queries(prisma);
    }),
  },
}));

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

beforeEach(() => {
  vi.clearAllMocks();

  // Default — valid JWT for every test
  (jwt.verify as any).mockReturnValue({
    userId: "user-1",
    tenantId: "tenant-1",
    role: "ADMIN",
  });
});

const authHeader = { Authorization: "Bearer fake-token" };

describe("GET /users", () => {
  it("should return 401 if no token provided", async () => {
    (jwt.verify as any).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const res = await request(app).get("/users/users");
    expect(res.status).toBe(401);
  });

  it("should return 200 and paginated users", async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "user-1", email: "user@acme.com", role: "ADMIN" },
    ]);
    (prisma.user.count as any).mockResolvedValue(1);

    const res = await request(app).get("/users/users").set(authHeader);

    console.log("STATUS:", res.status);
    console.log("BODY:", res.body);

    expect(res.status).toBe(200);
  });

  it("should return 200 with filtered results by role", async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "user-1", email: "user@acme.com", role: "ADMIN" },
    ]);
    (prisma.user.count as any).mockResolvedValue(1);

    const res = await request(app)
      .get("/users/users?role=ADMIN")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data[0].role).toBe("ADMIN");
  });
});

describe("GET /users/:id", () => {
  it("should return 401 if no token provided", async () => {
    (jwt.verify as any).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const res = await request(app).get("/users/users/user-1");
    expect(res.status).toBe(401);
  });

  it("should return 404 if user not found", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);

    const res = await request(app)
      .get("/users/users/nonexistent")
      .set(authHeader);

    expect(res.status).toBe(404);
  });

  it("should return 200 and user if found", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "user-1",
      email: "user@acme.com",
      role: "ADMIN",
    });

    const res = await request(app).get("/users/users/user-1").set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "user@acme.com");
  });
});

describe("PATCH /users/:id/role", () => {
  it("should return 403 if user is not ADMIN", async () => {
    (jwt.verify as any).mockReturnValue({
      userId: "user-1",
      tenantId: "tenant-1",
      role: "MEMBER",
    });

    const res = await request(app)
      .patch("/users/users/user-2/role")
      .set(authHeader)
      .send({ role: "MANAGER" });

    expect(res.status).toBe(403);
  });

  it("should return 400 if role is invalid", async () => {
    const res = await request(app)
      .patch("/users/users/user-2/role")
      .set(authHeader)
      .send({ role: "SUPERADMIN" });

    expect(res.status).toBe(400);
  });

  it("should return 200 and updated user on success", async () => {
    (prisma.user.update as any).mockResolvedValue({
      id: "user-2",
      email: "user2@acme.com",
      role: "MANAGER",
    });

    const res = await request(app)
      .patch("/users/users/user-2/role")
      .set(authHeader)
      .send({ role: "MANAGER" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("role", "MANAGER");
  });
});

describe("DELETE /users/:id", () => {
  it("should return 403 if user is not ADMIN", async () => {
    (jwt.verify as any).mockReturnValue({
      userId: "user-1",
      tenantId: "tenant-1",
      role: "MEMBER",
    });

    const res = await request(app)
      .delete("/users/users/user-2")
      .set(authHeader);

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful delete", async () => {
    (prisma.user.delete as any).mockResolvedValue({});

    const res = await request(app)
      .delete("/users/users/user-2")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "User deleted successfully");
  });
});
