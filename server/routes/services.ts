import { Router, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { authenticateJwt, requirePermission, getClientIp, AuthenticatedRequest } from '../auth.js';
import { logAudit } from '../audit.js';
import { ChurchService } from '../../src/types/index.js';

export const servicesRouter = Router();

servicesRouter.use(authenticateJwt);

// GET /api/services - List services
servicesRouter.get('/', requirePermission('view_services'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  let services = [...db.services];

  // If user has scoped role, still return services for dropdowns, but can mark accessible
  const userScope = user.scope;

  const enriched = services.map((srv) => {
    const servantCount = db.servants.filter((s) => s.current_service_id === srv.id && s.status === 'active').length;
    const totalAttendance = db.attendance.filter((a) => a.service_id === srv.id).length;
    const presentAttendance = db.attendance.filter((a) => a.service_id === srv.id && a.status === 'present').length;
    const attendance_rate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 100;

    return {
      ...srv,
      servants_count: servantCount,
      attendance_rate,
      accessible: user.role === 'super_admin' || userScope === 'all' || userScope === srv.id,
    };
  });

  res.json({ success: true, services: enriched });
});

// POST /api/services - Add service
servicesRouter.post('/', requirePermission('add_service'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const { name, name_ar, code, description, meeting_day, meeting_time } = req.body;

  if (!name_ar) {
    res.status(400).json({ error: 'اسم الخدمة بالعربية مطلوب' });
    return;
  }

  const newService: ChurchService = {
    id: `srvc_${Date.now()}`,
    name: name ? name.trim() : name_ar.trim(),
    name_ar: name_ar.trim(),
    code: code ? code.trim().toUpperCase() : 'SRV',
    description,
    meeting_day,
    meeting_time,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  db.services.push(newService);
  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'SERVICE_CREATED',
    targetType: 'SERVICE',
    targetId: newService.id,
    targetName: newService.name_ar,
    description: `قام المستخدم (${user.name}) بإنشاء خدمة جديدة (${newService.name_ar})`,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ success: true, service: newService });
});

// PUT /api/services/:id - Update service
servicesRouter.put('/:id', requirePermission('edit_service'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const service = db.services.find((s) => s.id === req.params.id);

  if (!service) {
    res.status(404).json({ error: 'الخدمة غير موجودة' });
    return;
  }

  const { name, name_ar, code, description, meeting_day, meeting_time, status } = req.body;

  const before = { ...service };

  service.name = name !== undefined ? name.trim() : service.name;
  service.name_ar = name_ar !== undefined ? name_ar.trim() : service.name_ar;
  service.code = code !== undefined ? code.trim().toUpperCase() : service.code;
  service.description = description !== undefined ? description : service.description;
  service.meeting_day = meeting_day !== undefined ? meeting_day : service.meeting_day;
  service.meeting_time = meeting_time !== undefined ? meeting_time : service.meeting_time;
  if (status) service.status = status;

  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'SERVICE_UPDATED',
    targetType: 'SERVICE',
    targetId: service.id,
    targetName: service.name_ar,
    description: `قام المستخدم (${user.name}) بتحديث بيانات خدمة (${service.name_ar})`,
    ipAddress: getClientIp(req),
    changes: {
      before,
      after: { ...service },
    },
  });

  res.json({ success: true, service });
});

// DELETE /api/services/:id - Delete service
servicesRouter.delete('/:id', requirePermission('delete_service'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const index = db.services.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'الخدمة غير موجودة' });
    return;
  }

  const service = db.services[index];

  // Check if servants are assigned to this service
  const assignedServants = db.servants.filter((s) => s.current_service_id === service.id);
  if (assignedServants.length > 0) {
    res.status(400).json({
      error: `لا يمكن حذف هذه الخدمة نظراً لوجود (${assignedServants.length}) خادم مسجلين بها. يرجى نقلهم لخدمة أخرى أولاً أو تعطيل الخدمة.`,
    });
    return;
  }

  db.services.splice(index, 1);
  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'SERVICE_DELETED',
    targetType: 'SERVICE',
    targetId: service.id,
    targetName: service.name_ar,
    description: `قام المستخدم (${user.name}) بحذف خدمة (${service.name_ar})`,
    ipAddress: getClientIp(req),
  });

  res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
});
