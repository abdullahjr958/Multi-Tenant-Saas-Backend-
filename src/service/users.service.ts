import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";

const getUsers = async (tenantId: string) => {
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, role: true },
  });
  return users;
};

const getUserById = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true, email: true, role: true },
  });
  if (!user) throw new Error("User not found");
  return user;
};

const updateUserRole = async (id: string, tenantId: string, role: Role) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id, tenantId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    return updatedUser;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new Error("User not found");
    throw error;
  }
};

const deleteUser = async (id: string, tenantId: string) => {
  try {
    await prisma.user.delete({
      where: { id, tenantId },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new Error("User not found");
    throw error;
  }
};

export { getUsers, getUserById, updateUserRole, deleteUser };