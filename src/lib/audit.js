import prisma from "@/lib/prisma";

const sanitizeMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(metadata, (_key, value) => (typeof value === "undefined" ? null : value)));
  } catch (error) {
    console.error("recordAudit: failed to sanitize metadata", error);
    return null;
  }
};

export const recordAudit = async (action, { actor, entity, entityId, ip, metadata } = {}) => {
  try {
    await prisma.adminAudit.create({
      data: {
        action,
        actor: actor || null,
        entity: entity || null,
        entityId: entityId || null,
        ip: ip || null,
        metadata: sanitizeMetadata(metadata),
      },
    });
  } catch (error) {
    console.error(`recordAudit(${action}) failed`, error);
  }
};
