import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

const getTenantByIdService = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, createdAt: true },
  });
  if (!tenant) throw new Error("Tenant not found");
  return tenant;
};

const updateTenantService = async (
  tenantId: string,
  name: string,
  slug: string | null,
) => {
  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, ...(slug && { slug }) },
      select: { id: true, name: true, slug: true, createdAt: true },
    });

    return updatedTenant;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new Error("Tenant not found");
    throw error;
  }
};

export { getTenantByIdService, updateTenantService };
