import { prisma } from "../lib/prisma";

const createAuditLog = async (
  action: string,
  entity: string,
  entityId: string,
  userId: string,
  tenantId: string,
  metadata?: object,
) => {
  if (!action || !entity || !entityId || !userId || !tenantId)
    throw new Error("Missing required fields for audit log");

  const auditlog = await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      tenantId,
      ...(metadata && { metadata }),
    },
  });

  return auditlog;
};

export { createAuditLog };
