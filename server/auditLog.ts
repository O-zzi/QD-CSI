import { storage } from "./storage";
import type { Request } from "express";
import type { User } from "@shared/schema";

interface AuditLogParams {
  req: Request;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export async function logAdminAction(params: AuditLogParams): Promise<void> {
  const { req, action, resource, resourceId, details } = params;
  
  const user = req.user as User | undefined;
  if (!user) return;
  
  try {
    await storage.createAuditLog({
      adminId: user.id,
      adminEmail: user.email || 'unknown',
      action,
      resource,
      resourceId: resourceId || null,
      details: details || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
