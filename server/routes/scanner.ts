import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb, saveDatabase } from '../db.js';
import { authenticateJwt, requirePermission, getClientIp, AuthenticatedRequest } from '../auth.js';
import { logAudit } from '../audit.js';
import { ScannerDevice, DeviceRegistrationCode, GeneralMeetingRecord, GeneralMeeting } from '../../src/types/index.js';
import { isServantPriest } from './meetings.js';

export const scannerRouter = Router();

// 1. Generate 8-digit device pairing code (Priest, Super Admin, General Secretary)
// Valid for exactly 10 minutes
scannerRouter.post(
  '/code/generate',
  authenticateJwt,
  requirePermission('manage_scanner', 'full_access'),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const db = getDb();

    // Generate random 8-digit numeric string
    const codeNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const regCode: DeviceRegistrationCode = {
      code: codeNumber,
      created_by_user_id: user.id,
      created_by_name: user.name,
      expires_at: expiresAt,
      used: false,
    };

    db.registration_codes.push(regCode);
    saveDatabase();

    logAudit({
      userId: user.id,
      username: user.username,
      action: 'SCANNER_CODE_GENERATED',
      targetType: 'SCANNER',
      description: `قام (${user.name}) بتوليد كود تسجيل جهاز سكانر جديد (${codeNumber}) صالح لمدة 10 دقائق`,
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      code: codeNumber,
      expires_at: expiresAt,
      valid_for_seconds: 600,
    });
  }
);

// 2. Register new scanner device using 8-digit OTP (Public - called from trusted mobile)
scannerRouter.post('/devices/register', (req: Request, res: Response) => {
  const { code, device_name } = req.body;
  const ip = getClientIp(req);

  if (!code || !device_name) {
    res.status(400).json({ error: 'يرجى إدخال كود التسجيل المكون من 8 أرقام واسم للجهاز' });
    return;
  }

  const cleanCode = String(code).trim();
  const cleanName = String(device_name).trim();

  if (cleanCode.length !== 8 || !/^\d+$/.test(cleanCode)) {
    res.status(400).json({ error: 'كود التسجيل يجب أن يتكون من 8 أرقام' });
    return;
  }

  const db = getDb();
  const codeRecord = db.registration_codes.find((c) => c.code === cleanCode);

  if (!codeRecord) {
    res.status(404).json({ error: 'كود التسجيل غير صحيح أو غير موجود' });
    return;
  }

  if (codeRecord.used) {
    res.status(400).json({ error: 'تم استخدام هذا الكود بالفعل مسبقاً لتسجيل جهاز آخر' });
    return;
  }

  const now = Date.now();
  const expiresAt = new Date(codeRecord.expires_at).getTime();
  if (now > expiresAt) {
    res.status(400).json({ error: 'انتهت صلاحية هذا الكود (صلاحية الكود 10 دقائق فقط). اطلب من الإدارة توليد كود جديد.' });
    return;
  }

  // Generate a cryptographically secure random token (64 hex characters)
  const deviceToken = crypto.randomBytes(32).toString('hex');
  const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newDevice: ScannerDevice = {
    id: deviceId,
    name: cleanName,
    device_token: deviceToken,
    is_active: true,
    registered_at: nowIso,
    total_scans: 0,
    registered_with_code: cleanCode,
  };

  codeRecord.used = true;
  codeRecord.used_at = nowIso;
  codeRecord.used_by_device_name = cleanName;

  db.scanner_devices.push(newDevice);
  saveDatabase();

  logAudit({
    username: 'TRUSTED_DEVICE',
    action: 'SCANNER_DEVICE_REGISTERED',
    targetType: 'SCANNER',
    targetId: deviceId,
    targetName: cleanName,
    description: `تم تسجيل جهاز سكانر موثوق جديد بنجاح: (${cleanName}) بكود (${cleanCode})`,
    ipAddress: ip,
  });

  res.json({
    success: true,
    message: 'تم تسجيل الجهاز وتوثيقه بنجاح!',
    device_token: deviceToken,
    device: {
      id: newDevice.id,
      name: newDevice.name,
      is_active: newDevice.is_active,
      registered_at: newDevice.registered_at,
    },
  });
});

// 3. Verify device token (called on app startup by trusted phone)
scannerRouter.post('/verify-token', (req: Request, res: Response) => {
  const token = req.body.device_token || req.headers['x-device-token'];
  if (!token) {
    res.status(401).json({ error: 'لم يتم توفير توكن الجهاز' });
    return;
  }

  const db = getDb();
  const device = db.scanner_devices.find((d) => d.device_token === token);

  if (!device) {
    res.status(401).json({ error: 'الجهاز غير مسجل أو التوكن غير صالح' });
    return;
  }

  if (!device.is_active) {
    res.status(403).json({ error: 'تم تعطيل صلاحية هذا الجهاز من قبل الإدارة' });
    return;
  }

  res.json({
    valid: true,
    device: {
      id: device.id,
      name: device.name,
      is_active: device.is_active,
      registered_at: device.registered_at,
      total_scans: device.total_scans,
      last_used_at: device.last_used_at,
    },
  });
});

// 4. List all scanner devices (Admin)
scannerRouter.get(
  '/devices',
  authenticateJwt,
  requirePermission('manage_scanner', 'full_access'),
  (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const safeDevices = db.scanner_devices.map((d) => {
      const { device_token, ...rest } = d;
      return rest;
    });

    res.json({
      success: true,
      devices: safeDevices,
    });
  }
);

// 5. Toggle scanner device active/disabled (Admin)
scannerRouter.patch(
  '/devices/:id/toggle',
  authenticateJwt,
  requirePermission('manage_scanner', 'full_access'),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const db = getDb();
    const device = db.scanner_devices.find((d) => d.id === req.params.id);

    if (!device) {
      res.status(404).json({ error: 'الجهاز غير موجود' });
      return;
    }

    device.is_active = !device.is_active;
    saveDatabase();

    logAudit({
      userId: user.id,
      username: user.username,
      action: device.is_active ? 'SCANNER_DEVICE_ENABLED' : 'SCANNER_DEVICE_REVOKED',
      targetType: 'SCANNER',
      targetId: device.id,
      targetName: device.name,
      description: `قام (${user.name}) بـ ${device.is_active ? 'تفعيل' : 'تعطيل وسحب الثقة من'} جهاز السكانر (${device.name})`,
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      is_active: device.is_active,
      message: device.is_active ? 'تم تفعيل الجهاز' : 'تم سحب الثقة وتعطيل الجهاز بنجاح',
    });
  }
);

// 6. Delete scanner device (Admin)
scannerRouter.delete(
  '/devices/:id',
  authenticateJwt,
  requirePermission('manage_scanner', 'full_access'),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const db = getDb();
    const index = db.scanner_devices.findIndex((d) => d.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: 'الجهاز غير موجود' });
      return;
    }

    const device = db.scanner_devices[index];
    db.scanner_devices.splice(index, 1);
    saveDatabase();

    logAudit({
      userId: user.id,
      username: user.username,
      action: 'SCANNER_DEVICE_DELETED',
      targetType: 'SCANNER',
      targetId: device.id,
      targetName: device.name,
      description: `قام (${user.name}) بحذف جهاز السكانر (${device.name}) من النظام نهائياً`,
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'تم حذف الجهاز بنجاح' });
  }
);

// 7. Core QR Scan Attendance Endpoint for General Servants Meeting (اجتماع الخدام العام)
scannerRouter.post('/scan', (req: Request, res: Response) => {
  const token = req.body.device_token || req.headers['x-device-token'];
  const { qr_data } = req.body;
  const ip = getClientIp(req);

  if (!token) {
    res.status(401).json({ error: 'رمز الجهاز مفقود. يرجى استخدام جهاز مسجل وموثوق.' });
    return;
  }

  const db = getDb();
  const device = db.scanner_devices.find((d) => d.device_token === token);

  if (!device) {
    res.status(403).json({ error: 'هذا الجهاز غير موثوق به لتسجيل الحضور. يرجى تسجيل الجهاز أولاً بكود من الإدارة.' });
    return;
  }

  if (!device.is_active) {
    res.status(403).json({ error: 'تم إيقاف صلاحية هذا الجهاز من قبل الإدارة. يرجى مراجعة أبونا أو إدارة الخدمة.' });
    return;
  }

  if (!qr_data) {
    res.status(400).json({ error: 'لم يتم استلام بيانات QR' });
    return;
  }

  // Parse QR content: could be raw servant id, national_id, or JSON
  let rawStr = String(qr_data).trim();
  let servantId = rawStr;
  let nationalId = '';

  try {
    if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
      const parsed = JSON.parse(rawStr);
      if (parsed.servant_id) servantId = parsed.servant_id;
      if (parsed.id) servantId = parsed.id;
      if (parsed.national_id) nationalId = parsed.national_id;
    }
  } catch {
    // raw string
  }

  // Search servant by ID or national ID or phone
  const servant = db.servants.find(
    (s) =>
      s.id === servantId ||
      s.national_id === servantId ||
      (nationalId && s.national_id === nationalId) ||
      s.phone === servantId
  );

  if (!servant) {
    res.status(404).json({
      error: 'رمز الكارنيه غير صالح: لم يتم العثور على خادم مسجل بهذه البيانات في الكنيسة.',
    });
    return;
  }

  const srv = db.services.find((s) => s.id === servant.current_service_id);
  const serviceName = srv ? srv.name_ar : 'غير محدد';
  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  // Format time for Arabic display (e.g. 07:30 م)
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return iso;
    }
  };

  // CHECK PRIEST EXEMPTION: Priests are not tracked for attendance or absence
  if (isServantPriest(servant)) {
    res.json({
      success: true,
      action_type: 'priest_exempt',
      message: `قدس أبونا (${servant.full_name}) معفى من تسجيل الحضور والغياب (حفظه الله ورعاه). نطلب صلواتكم وبركتكم.`,
      servant: {
        id: servant.id,
        full_name: servant.full_name,
        phone: servant.phone,
        service_name: serviceName,
        current_role: servant.current_role || 'أب كاهن',
        profile_photo: servant.profile_photo,
      },
      is_priest: true,
      time: formatTime(nowIso),
      device_name: device.name,
    });
    return;
  }

  // Ensure meetings list exists
  if (!db.general_meetings) {
    db.general_meetings = [];
  }

  // Find or automatically initiate today's meeting on first scan
  let meeting = db.general_meetings.find(
    (m) => m.date === today && m.status !== 'cancelled'
  );

  if (!meeting) {
    meeting = {
      id: `meeting_${Date.now()}_auto`,
      title: `اجتماع الخدام الأسبوعي - ${today}`,
      speaker: 'الأمانة العامة للخدمة',
      date: today,
      start_time: '12:00',
      end_time: '14:00',
      late_cutoff_time: '13:00',
      status: 'active',
      created_by_user_id: device.id,
      created_by_name: device.name,
      created_at: nowIso,
      updated_at: nowIso,
    };
    db.general_meetings.push(meeting);
    saveDatabase();
  }

  // Determine if current scan is after the late cutoff time (e.g. 13:00)
  // Format current Cairo/local time in HH:mm
  let currentHourMin = '';
  try {
    currentHourMin = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    const d = new Date();
    currentHourMin = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  const cutoff = meeting.late_cutoff_time || '13:00';
  const isPastCutoff = currentHourMin > cutoff;

  // Find existing general meeting record for this servant today/meeting
  const existingRecord = db.general_meeting_records.find(
    (r) => r.servant_id === servant.id && (r.meeting_id === meeting!.id || r.date === today)
  );

  // CASE 1: No previous record today -> First scan (Check-in or Late Absent)
  if (!existingRecord) {
    const isLate = isPastCutoff;
    const initialStatus = isLate ? 'late_absent' : 'checked_in';

    const newRecord: GeneralMeetingRecord = {
      id: `gmr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      meeting_id: meeting.id,
      meeting_title: meeting.title,
      meeting_speaker: meeting.speaker,
      servant_id: servant.id,
      servant_name: servant.full_name,
      servant_phone: servant.phone,
      servant_national_id: servant.national_id,
      service_id: servant.current_service_id,
      service_name: serviceName,
      date: today,
      check_in_time: nowIso,
      status: initialStatus,
      is_late: isLate,
      scanner_device_id: device.id,
      scanner_device_name: device.name,
      notes: isLate ? `تم المسح بعد آخر موعد حضور مسموح (${cutoff})` : 'حضور في الموعد',
      created_at: nowIso,
      updated_at: nowIso,
    };

    db.general_meeting_records.push(newRecord);
    device.total_scans += 1;
    device.last_used_at = nowIso;
    saveDatabase();

    logAudit({
      username: device.name,
      action: isLate ? 'MEETING_LATE_ABSENT' : 'MEETING_CHECK_IN',
      targetType: 'ATTENDANCE',
      targetId: servant.id,
      targetName: servant.full_name,
      description: isLate
        ? `تم تسجيل الخادم (${servant.full_name}) "غياب" لتجاوزه آخر ميعاد للحضور (${cutoff}) الساعة ${formatTime(nowIso)}`
        : `تم تسجيل حضور الخادم (${servant.full_name}) في اجتماع الخدام العام (${meeting.title}) الساعة ${formatTime(nowIso)}`,
      ipAddress: ip,
    });

    if (isLate) {
      res.json({
        success: true,
        action_type: 'late_absent',
        warning: true,
        message: `⚠️ تنبيه: تجاوزت الساعة آخر موعد لتسجيل الحضور (${cutoff}). تم تسجيل الخادم (${servant.full_name}) "غياب" لتأخره عن موعد الاجتماع.`,
        meeting_title: meeting.title,
        cutoff_time: cutoff,
        servant: {
          id: servant.id,
          full_name: servant.full_name,
          phone: servant.phone,
          service_name: serviceName,
          current_role: servant.current_role,
          profile_photo: servant.profile_photo,
        },
        time: formatTime(nowIso),
        check_in_time: nowIso,
        device_name: device.name,
      });
      return;
    }

    res.json({
      success: true,
      action_type: 'check_in',
      message: `تم تسجيل حضور الخادم (${servant.full_name}) في اجتماع الخدام بنجاح الساعة ${formatTime(nowIso)}!`,
      meeting_title: meeting.title,
      cutoff_time: cutoff,
      servant: {
        id: servant.id,
        full_name: servant.full_name,
        phone: servant.phone,
        service_name: serviceName,
        current_role: servant.current_role,
        profile_photo: servant.profile_photo,
      },
      time: formatTime(nowIso),
      check_in_time: nowIso,
      device_name: device.name,
    });
    return;
  }

  // CASE 2: Already recorded today -> Check time difference
  const checkInDate = existingRecord.check_in_time
    ? new Date(existingRecord.check_in_time).getTime()
    : Date.now();
  const diffMs = Date.now() - checkInDate;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  // IF scanned within 5 minutes: Duplicate scan warning!
  if (diffMinutes < 5) {
    res.json({
      success: true,
      action_type: 'duplicate_warning',
      warning: true,
      message: `تنبيه: تم تسجيل هذا الخادم بالفعل منذ ${
        diffMinutes === 0 ? 'لحظات' : `${diffMinutes} دقيقة`
      }! (لا يمكن إعادة المسح في غضون 5 دقائق).`,
      meeting_title: meeting.title,
      servant: {
        id: servant.id,
        full_name: servant.full_name,
        phone: servant.phone,
        service_name: serviceName,
        current_role: servant.current_role,
        profile_photo: servant.profile_photo,
      },
      initial_check_in: existingRecord.check_in_time ? formatTime(existingRecord.check_in_time) : '',
      elapsed_minutes: diffMinutes,
      device_name: device.name,
    });
    return;
  }

  // CASE 3: Scanned after 5 minutes -> Check-out (تسجيل انصراف / خروج)
  existingRecord.check_out_time = nowIso;
  existingRecord.duration_minutes = diffMinutes;
  existingRecord.status = existingRecord.is_late ? 'late_absent' : 'completed';
  existingRecord.updated_at = nowIso;

  device.total_scans += 1;
  device.last_used_at = nowIso;
  saveDatabase();

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  let durationText = '';
  if (hours > 0) {
    durationText = `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
  } else {
    durationText = `${mins} دقيقة`;
  }

  logAudit({
    username: device.name,
    action: 'MEETING_CHECK_OUT',
    targetType: 'ATTENDANCE',
    targetId: servant.id,
    targetName: servant.full_name,
    description: `تم تسجيل انصراف الخادم (${servant.full_name}) من اجتماع الخدام (${meeting.title}) بواسطة (${device.name}). مدة الحضور: ${durationText}`,
    ipAddress: ip,
  });

  res.json({
    success: true,
    action_type: 'check_out',
    message: `تم تسجيل انصراف الخادم (${servant.full_name}) بنجاح. مدة التواجد بالاجتماع: ${durationText}`,
    meeting_title: meeting.title,
    servant: {
      id: servant.id,
      full_name: servant.full_name,
      phone: servant.phone,
      service_name: serviceName,
      current_role: servant.current_role,
      profile_photo: servant.profile_photo,
    },
    check_in_time: existingRecord.check_in_time ? formatTime(existingRecord.check_in_time) : '',
    check_out_time: formatTime(nowIso),
    duration_minutes: diffMinutes,
    duration_text: durationText,
    device_name: device.name,
  });
});

// 8. General Meeting Attendance Records & Live Feed
scannerRouter.get(
  '/general-meeting',
  authenticateJwt,
  (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const date = req.query.date ? String(req.query.date) : new Date().toISOString().split('T')[0];
    const serviceId = req.query.service_id ? String(req.query.service_id) : '';

    let records = db.general_meeting_records.filter((r) => r.date === date);

    if (serviceId) {
      records = records.filter((r) => r.service_id === serviceId);
    }

    const totalAttended = records.length;
    const currentlyInMeeting = records.filter((r) => r.status === 'checked_in').length;
    const completedDeparture = records.filter((r) => r.status === 'completed').length;

    const totalDuration = records
      .filter((r) => r.duration_minutes !== undefined)
      .reduce((acc, r) => acc + (r.duration_minutes || 0), 0);
    const avgDuration =
      completedDeparture > 0 ? Math.round(totalDuration / completedDeparture) : 0;

    res.json({
      success: true,
      date,
      stats: {
        total_attended: totalAttended,
        currently_inside: currentlyInMeeting,
        completed_departure: completedDeparture,
        average_duration_minutes: avgDuration,
      },
      records: records.slice().reverse(),
    });
  }
);
