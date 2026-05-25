import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { createAuditLog } from "./audit.service";
import { GetUsersQuery } from "../validators/users.validator";
import AppError from "../lib/AppError";

const getUsers = async (tenantId: string, query: GetUsersQuery) => {
  const { page, limit, role, email } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    tenantId,
    ...(role && { role }),
    ...(email && { email: { contains: email, mode: "insensitive" } }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getUserById = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true, email: true, role: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const updateUserRole = async (id: string, userId: string, tenantId: string, role: Role) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id, tenantId },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    createAuditLog("USER_ROLE_UPDATE", "User", id, userId, tenantId, { newRole: role }).catch(err => console.error(`Failed to create audit log: ${err.message}`));
    return updatedUser;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new AppError("User not found", 404);
    throw error;
  }
};

const deleteUser = async (id: string, userId: string, tenantId: string) => {
  try {
    await prisma.user.delete({
      where: { id, tenantId },
    });

    createAuditLog("USER_DELETED", "User", id, userId, tenantId).catch(err => console.error(`Failed to create audit log: ${err.message}`));
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new AppError("User not found", 404);
    throw error;
  }
};

export { getUsers, getUserById, updateUserRole, deleteUser };