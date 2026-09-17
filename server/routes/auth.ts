import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDatabase } from '../db.js';
import { generateToken, authenticateJwt, getClientIp, AuthenticatedRequest } from '../auth.js';
import { logAudit } from '../audit.js';

export const authRouter = Router();

// Management User Login
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = getClientIp(req);

  if (!username || !password) {
    res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    return;
  }

  const db = getDb();
  const cleanUsername = String(username).trim().toLowerCase();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    logAudit({
      username: cleanUsername,
      action: 'FAILED_LOGIN',
      targetType: 'USER',
      description: `فشل تسجيل الدخول: اسم المستخدم (${cleanUsername}) غير مسجل`,
      ipAddress: ip,
    });
    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    return;
  }

  if (user.status === 'disabled') {
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'FAILED_LOGIN_DISABLED',
      targetType: 'USER',
      targetId: user.id,
      description: `محاولة تسجيل دخول لحساب معطل (${user.username})`,
      ipAddress: ip,
    });
    res.status(403).json({ error: 'تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash || '');
  if (!isMatch) {
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'FAILED_LOGIN_PASSWORD',
      targetType: 'USER',
      targetId: user.id,
      description: `فشل تسجيل الدخول: كلمة المرور غير صحيحة للحساب (${user.username})`,
      ipAddress: ip,
    });
    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    return;
  }

  // Update last login
  user.last_login = new Date().toISOString();
  saveDatabase();

  const token = generateToken(user);

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'USER_LOGIN',
    targetType: 'USER',
    targetId: user.id,
    targetName: user.name,
    description: `قام المستخدم (${user.name}) بتسجيل الدخول إلى لوحة الإدارة بنجاح`,
    ipAddress: ip,
  });

  const { password_hash, ...safeUser } = user;
  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Current User Info
authRouter.get('/me', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'غير مصرح' });
    return;
  }
  const { password_hash, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// Logout
authRouter.post('/logout', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    logAudit({
      userId: req.user.id,
      username: req.user.username,
      action: 'USER_LOGOUT',
      targetType: 'USER',
      targetId: req.user.id,
      targetName: req.user.name,
      description: `قام المستخدم (${req.user.name}) بتسجيل الخروج من النظام`,
      ipAddress: getClientIp(req),
    });
  }
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// Change Password
authRouter.post('/change-password', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const { current_password, new_password } = req.body;
  const user = req.user!;

  if (!current_password || !new_password) {
    res.status(400).json({ error: 'يرجى تقديم كلمة المرور الحالية وكلمة المرور الجديدة' });
    return;
  }

  if (new_password.length < 6) {
    res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 خانات' });
    return;
  }

  const isMatch = bcrypt.compareSync(current_password, user.password_hash || '');
  if (!isMatch) {
    res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    return;
  }

  const db = getDb();
  const dbUser = db.users.find((u) => u.id === user.id);
  if (dbUser) {
    dbUser.password_hash = bcrypt.hashSync(new_password, 10);
    dbUser.must_change_password = false;
    dbUser.updated_at = new Date().toISOString();
    saveDatabase();

    logAudit({
      userId: user.id,
      username: user.username,
      action: 'PASSWORD_CHANGE',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.name,
      description: `قام المستخدم (${user.name}) بتغيير كلمة المرور الخاصة به`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } else {
    res.status(404).json({ error: 'المستخدم غير موجود' });
  }
});

// Force change password on first login
authRouter.post('/force-change-password', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const { new_password } = req.body;
  const user = req.user!;

  if (!new_password || new_password.length < 6) {
    res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام' });
    return;
  }

  const db = getDb();
  const dbUser = db.users.find((u) => u.id === user.id);
  if (!dbUser) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  dbUser.password_hash = bcrypt.hashSync(new_password, 10);
  dbUser.must_change_password = false;
  dbUser.updated_at = new Date().toISOString();
  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'FORCE_PASSWORD_CHANGED',
    targetType: 'USER',
    targetId: user.id,
    targetName: user.name,
    description: `قام المستخدم (${user.name}) بتعيين كلمة مرور شخصية جديدة بنجاح في أول تسجيل دخول`,
    ipAddress: getClientIp(req),
  });

  const { password_hash, ...safeUser } = dbUser;
  res.json({
    success: true,
    message: 'تم تعيين كلمة المرور الجديدة بنجاح، مرحباً بك في النظام!',
    user: safeUser,
  });
});
