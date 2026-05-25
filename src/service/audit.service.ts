import AppError from "../lib/AppError";
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
    throw new AppError("Missing required fields for audit log", 401);

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
