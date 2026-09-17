import { Router, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { authenticateJwt, requirePermission, checkScopeAccess, getClientIp, AuthenticatedRequest } from '../auth.js';
import { logAudit } from '../audit.js';
import { AttendanceRecord } from '../../src/types/index.js';

export const attendanceRouter = Router();

attendanceRouter.use(authenticateJwt);

// GET /api/attendance - List and filter attendance records
attendanceRouter.get('/', requirePermission('view_attendance'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  let records = [...db.attendance];

  // Scope filter
  if (user.role !== 'super_admin' && user.scope !== 'all') {
    records = records.filter((r) => r.service_id === user.scope);
  }

  const serviceId = req.query.service_id ? String(req.query.service_id) : '';
  if (serviceId) {
    if (!checkScopeAccess(user, serviceId)) {
      res.status(403).json({ error: 'ليس لديك صلاحية لعرض غياب هذه الخدمة' });
      return;
    }
    records = records.filter((r) => r.service_id === serviceId);
  }

  const date = req.query.date ? String(req.query.date) : '';
  if (date) {
    records = records.filter((r) => r.date === date);
  }

  const servantId = req.query.servant_id ? String(req.query.servant_id) : '';
  if (servantId) {
    records = records.filter((r) => r.servant_id === servantId);
  }

  const status = req.query.status ? String(req.query.status) : '';
  if (status) {
    records = records.filter((r) => r.status === status);
  }

  // Calculate metrics
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const excused = records.filter((r) => r.status === 'excused').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

  // Enrich with names
  const enriched = records
    .slice()
    .reverse()
    .map((r) => {
      const servant = db.servants.find((s) => s.id === r.servant_id);
      const service = db.services.find((s) => s.id === r.service_id);
      return {
        ...r,
        servant_name: servant ? servant.full_name : 'خادم محذوف',
        servant_phone: servant ? servant.phone : '',
        service_name: service ? service.name_ar : 'خدمة',
      };
    });

  res.json({
    success: true,
    stats: {
      total,
      present,
      absent,
      excused,
      percentage,
    },
    records: enriched,
  });
});

// POST /api/attendance/bulk - Record or update bulk attendance for a meeting/service
attendanceRouter.post('/bulk', requirePermission('add_attendance'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const { service_id, date, entries } = req.body;

  if (!service_id || !date || !Array.isArray(entries)) {
    res.status(400).json({ error: 'الخدمة، التاريخ، وقائمة الخدام حقول مطلوبة' });
    return;
  }

  if (!checkScopeAccess(user, service_id)) {
    res.status(403).json({ error: 'ليس لديك صلاحية لتسجيل حضور في هذه الخدمة' });
    return;
  }

  const srv = db.services.find((s) => s.id === service_id);
  const nowIso = new Date().toISOString();
  let updatedCount = 0;
  let createdCount = 0;

  for (const entry of entries) {
    if (!entry.servant_id || !entry.status) continue;

    // Check if a record already exists for this servant on this date
    const existingIndex = db.attendance.findIndex(
      (r) => r.servant_id === entry.servant_id && r.date === date && r.service_id === service_id
    );

    if (existingIndex !== -1) {
      const existing = db.attendance[existingIndex];
      existing.status = entry.status;
      existing.notes = entry.notes !== undefined ? entry.notes : existing.notes;
      existing.recorded_by_user_id = user.id;
      existing.recorded_by_name = user.name;
      updatedCount++;
    } else {
      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        servant_id: entry.servant_id,
        service_id,
        date,
        status: entry.status,
        notes: entry.notes,
        recorded_by_user_id: user.id,
        recorded_by_name: user.name,
        created_at: nowIso,
      };
      db.attendance.push(newRecord);
      createdCount++;
    }
  }

  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'ATTENDANCE_BULK_RECORD',
    targetType: 'ATTENDANCE',
    targetId: service_id,
    targetName: srv ? srv.name_ar : service_id,
    description: `قام المستخدم (${user.name}) بتسجيل حضور لخدمة (${srv?.name_ar || service_id}) لتاريخ (${date}) بإجمالي ${entries.length} سجل (${createdCount} جديد، ${updatedCount} تعديل)`,
    ipAddress: getClientIp(req),
  });

  res.json({
    success: true,
    message: `تم حفظ الحضور بنجاح (${createdCount} جديد، ${updatedCount} تعديل)`,
    createdCount,
    updatedCount,
  });
});

// PUT /api/attendance/:id - Update single record (Captain updating attendance status)
attendanceRouter.put('/:id', requirePermission('edit_attendance'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const record = db.attendance.find((r) => r.id === req.params.id);

  if (!record) {
    res.status(404).json({ error: 'سجل الحضور غير موجود' });
    return;
  }

  if (!checkScopeAccess(user, record.service_id)) {
    res.status(403).json({ error: 'ليس لديك صلاحية لتعديل سجل الحضور في هذه الخدمة' });
    return;
  }

  const { status, notes } = req.body;
  const beforeStatus = record.status;
  const servant = db.servants.find((s) => s.id === record.servant_id);

  if (status) {
    record.status = status;
  }
  if (notes !== undefined) {
    record.notes = notes;
  }
  record.recorded_by_user_id = user.id;
  record.recorded_by_name = user.name;

  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'ATTENDANCE_UPDATE',
    targetType: 'ATTENDANCE',
    targetId: record.id,
    targetName: servant ? servant.full_name : record.servant_id,
    description: `قام المستخدم (${user.name}) بتعديل حالة حضور الخادم (${servant?.full_name || record.servant_id}) لتاريخ (${record.date}) من (${beforeStatus}) إلى (${record.status})`,
    ipAddress: getClientIp(req),
    changes: {
      before: { status: beforeStatus },
      after: { status: record.status },
    },
  });

  res.json({ success: true, record });
});

// DELETE /api/attendance/:id
attendanceRouter.delete('/:id', requirePermission('delete_attendance'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const index = db.attendance.findIndex((r) => r.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'السجل غير موجود' });
    return;
  }

  const record = db.attendance[index];
  if (!checkScopeAccess(user, record.service_id)) {
    res.status(403).json({ error: 'ليس لديك صلاحية لحذف سجلات هذه الخدمة' });
    return;
  }

  const servant = db.servants.find((s) => s.id === record.servant_id);
  db.attendance.splice(index, 1);
  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'ATTENDANCE_DELETE',
    targetType: 'ATTENDANCE',
    targetId: record.id,
    targetName: servant ? servant.full_name : record.servant_id,
    description: `قام المستخدم (${user.name}) بحذف سجل حضور الخادم (${servant?.full_name || record.servant_id}) لتاريخ (${record.date})`,
    ipAddress: getClientIp(req),
  });

  res.json({ success: true, message: 'تم حذف السجل بنجاح' });
});
