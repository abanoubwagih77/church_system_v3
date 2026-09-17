import { getDb, saveDatabase } from './db.js';
import { AuditLog } from '../src/types/index.js';

export interface AuditParams {
  userId?: string;
  username: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  description: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export function logAudit(params: AuditParams): AuditLog {
  const db = getDb();
  
  // Sanitize changes to strictly prevent sensitive info like passwords or full national IDs from appearing in logs
  const sanitize = (obj?: Record<string, any>) => {
    if (!obj) return undefined;
    const clean: Record<string, any> = { ...obj };
    const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'national_id'];
    for (const key of Object.keys(clean)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        clean[key] = '[HIDDEN_PROTECTED_DATA]';
      }
    }
    return clean;
  };

  const newLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: params.userId,
    username: params.username,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    target_name: params.targetName,
    description: params.description,
    ip_address: params.ipAddress,
    metadata: sanitize(params.metadata),
    changes: params.changes
      ? {
          before: sanitize(params.changes.before),
          after: sanitize(params.changes.after),
        }
      : undefined,
    timestamp: new Date().toISOString(),
  };

  // Prepend so latest appears first
  db.audit_logs.unshift(newLog);
  // Cap at 20,000 logs to preserve performance while retaining rich historical audit
  if (db.audit_logs.length > 20000) {
    db.audit_logs = db.audit_logs.slice(0, 20000);
  }
  saveDatabase();
  return newLog;
}
