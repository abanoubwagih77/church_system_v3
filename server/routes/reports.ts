import { Router, Response } from 'express';
import { getDb } from '../db.js';
import { authenticateJwt, requirePermission, AuthenticatedRequest } from '../auth.js';

export const reportsRouter = Router();

reportsRouter.use(authenticateJwt);

// GET /api/reports/dashboard - Scope-aware dashboard metrics
reportsRouter.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const isAllScope = user.role === 'super_admin' || user.scope === 'all';

  // Servants in user scope
  let servants = db.servants;
  if (!isAllScope) {
    servants = servants.filter((s) => s.current_service_id === user.scope);
  }

  const total_servants = servants.length;
  const active_servants = servants.filter((s) => s.status === 'active').length;
  const inactive_servants = servants.filter((s) => s.status === 'inactive').length;

  // Services in user scope
  let services = db.services;
  if (!isAllScope) {
    services = services.filter((s) => s.id === user.scope);
  }
  const total_services = services.length;

  // Attendance in user scope
  let attendance = db.attendance;
  if (!isAllScope) {
    attendance = attendance.filter((a) => a.service_id === user.scope);
  }

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const excusedCount = attendance.filter((a) => a.status === 'excused').length;
  const totalMeetings = attendance.length;
  const average_attendance = totalMeetings > 0 ? Math.round((presentCount / totalMeetings) * 100) : 100;

  // Services breakdown
  const services_stats = services.map((srv) => {
    const srvServants = servants.filter((s) => s.current_service_id === srv.id);
    const srvAttendance = attendance.filter((a) => a.service_id === srv.id);
    const srvPresent = srvAttendance.filter((a) => a.status === 'present').length;
    const srvTotal = srvAttendance.length;
    const rate = srvTotal > 0 ? Math.round((srvPresent / srvTotal) * 100) : 100;

    return {
      id: srv.id,
      name_ar: srv.name_ar,
      code: srv.code,
      total_servants: srvServants.length,
      active_servants: srvServants.filter((s) => s.status === 'active').length,
      attendance_rate: rate,
    };
  });

  // Recent activity in user scope
  let recentActivities = db.audit_logs;
  if (!isAllScope) {
    // Show only activities relevant to the user or their service
    const targetService = db.services.find((s) => s.id === user.scope);
    recentActivities = recentActivities.filter(
      (l) =>
        l.username === user.username ||
        (l.target_name && targetService && l.target_name.includes(targetService.name_ar)) ||
        l.target_id === user.scope
    );
  }

  res.json({
    success: true,
    stats: {
      total_servants,
      active_servants,
      inactive_servants,
      total_services,
      total_management_users: isAllScope ? db.users.length : 1,
      average_attendance,
      attendance_counts: {
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
        total: totalMeetings,
      },
      services_stats,
      recent_activities: recentActivities.slice(0, 10),
    },
  });
});

// GET /api/reports/roster - Printable servants roster
reportsRouter.get('/roster', requirePermission('view_reports'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDb();
  const serviceId = req.query.service_id ? String(req.query.service_id) : '';

  let servants = [...db.servants];
  if (user.role !== 'super_admin' && user.scope !== 'all') {
    servants = servants.filter((s) => s.current_service_id === user.scope);
  } else if (serviceId) {
    servants = servants.filter((s) => s.current_service_id === serviceId);
  }

  const roster = servants.map((s) => {
    const srv = db.services.find((sv) => sv.id === s.current_service_id);
    const recs = db.attendance.filter((a) => a.servant_id === s.id);
    const present = recs.filter((r) => r.status === 'present').length;
    const rate = recs.length > 0 ? Math.round((present / recs.length) * 100) : 100;

    return {
      full_name: s.full_name,
      phone: s.phone,
      service_name: srv ? srv.name_ar : 'غير محدد',
      role: s.current_role,
      status: s.status === 'active' ? 'نشط' : 'غير نشط',
      attendance_rate: `${rate}%`,
      joining_date: s.joining_date || '-',
      service_start_date: s.service_start_date || '-',
    };
  });

  res.json({ success: true, roster });
});
