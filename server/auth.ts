import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import { User, PermissionKey } from '../src/types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'st_george_church_servants_secure_jwt_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      scope: user.scope,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const db = getDb();
    const user = db.users.find((u) => u.id === decoded.id);

    if (!user) {
      res.status(401).json({ error: 'المستخدم غير موجود' });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({ error: 'تم تعطيل هذا الحساب من قبل الإدارة' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'جلسة تسجيل الدخول منتهية أو غير صالحة' });
  }
}

export function requirePermission(...permissions: PermissionKey[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'غير مصرح' });
      return;
    }

    // Super Admin or Priest with full_access or by role bypasses
    if (
      req.user.role === 'super_admin' ||
      req.user.role === 'priest' ||
      req.user.permissions.includes('full_access')
    ) {
      next();
      return;
    }

    const hasAny = permissions.some((p) => req.user?.permissions.includes(p));
    if (!hasAny) {
      res.status(403).json({
        error: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء',
        required_permissions: permissions,
      });
      return;
    }

    next();
  };
}

export function checkScopeAccess(user: User, serviceId?: string): boolean {
  if (
    user.role === 'super_admin' ||
    user.role === 'priest' ||
    user.role === 'general_secretary' ||
    user.scope === 'all' ||
    !serviceId
  ) {
    return true;
  }
  return user.scope === serviceId;
}
