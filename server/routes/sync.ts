import { Router, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { authenticateJwt, AuthenticatedRequest } from '../auth.js';
import { logAudit } from '../audit.js';

export const syncRouter = Router();

// POST /api/sync/restore - Sync client-side records into server /tmp or file database
syncRouter.post('/restore', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { servants, meetings, services, general_meeting_records } = req.body || {};
    const db = getDb();
    let updated = false;

    if (Array.isArray(servants) && servants.length > 0) {
      // Merge servants by id
      const existingIds = new Set((db.servants || []).map((s) => s.id));
      for (const s of servants) {
        if (!existingIds.has(s.id)) {
          db.servants.push(s);
          existingIds.add(s.id);
          updated = true;
        }
      }
    }

    if (Array.isArray(meetings) && meetings.length > 0) {
      if (!db.general_meetings) db.general_meetings = [];
      const existingMeetingIds = new Set(db.general_meetings.map((m) => m.id));
      for (const m of meetings) {
        if (!existingMeetingIds.has(m.id)) {
          db.general_meetings.push(m);
          existingMeetingIds.add(m.id);
          updated = true;
        }
      }
    }

    if (Array.isArray(services) && services.length > 0) {
      if (!db.services) db.services = [];
      const existingServiceIds = new Set(db.services.map((s) => s.id));
      for (const s of services) {
        if (!existingServiceIds.has(s.id)) {
          db.services.push(s);
          existingServiceIds.add(s.id);
          updated = true;
        }
      }
    }

    if (Array.isArray(general_meeting_records) && general_meeting_records.length > 0) {
      if (!db.general_meeting_records) db.general_meeting_records = [];
      const existingRecKeys = new Set(
        db.general_meeting_records.map((r) => `${r.meeting_id}_${r.servant_id}`)
      );
      for (const r of general_meeting_records) {
        const key = `${r.meeting_id}_${r.servant_id}`;
        if (!existingRecKeys.has(key)) {
          db.general_meeting_records.push(r);
          existingRecKeys.add(key);
          updated = true;
        }
      }
    }

    if (updated) {
      saveDatabase();
    }

    res.json({
      success: true,
      message: 'تمت مزامنة وحفظ البيانات بنجاح',
      counts: {
        servants: db.servants?.length || 0,
        meetings: db.general_meetings?.length || 0,
        services: db.services?.length || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'فشل مزامنة البيانات' });
  }
});

// POST /api/sync/reset-test-data - Reset test data for a clean fresh start (Admin only)
syncRouter.post('/reset-test-data', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'super_admin' && user.role !== 'priest') {
    res.status(403).json({ error: 'صلاحية تنظيف بيانات النظام مقتصرة على الإدارة العليا أو كاهن الكنيسة' });
    return;
  }

  const { target } = req.body || {}; // 'all', 'meetings', 'servants'
  const db = getDb();

  if (target === 'meetings' || target === 'all') {
    db.general_meetings = [];
    db.general_meeting_records = [];
  }

  if (target === 'servants' || target === 'all') {
    db.servants = [];
    db.attendance = [];
    db.assignments = [];
  }

  saveDatabase();

  logAudit({
    userId: user.id,
    username: user.name,
    action: 'SYSTEM_RESET_TEST_DATA',
    targetType: 'SYSTEM',
    description: `قام (${user.name}) بتنظيف البيانات التجريبية لبدء تشغيل نظيف (${target || 'all'})`,
  });

  res.json({
    success: true,
    message: 'تم تنظيف البيانات التجريبية بنجاح للبدء بنظافة',
  });
});
