import { User, ChurchService, Servant, ServiceAssignment, AttendanceRecord, AuditLog, GeneralMeeting, GeneralMeetingRecord } from '../types/index.js';

const STORAGE_KEY = 'st_george_local_church_db_v2';
const LEGACY_STORAGE_KEY = 'st_george_local_church_db_v1';

interface LocalDatabase {
  users: any[];
  servants: any[];
  services: any[];
  assignments: any[];
  attendance: any[];
  audit_logs: any[];
  meetings: GeneralMeeting[];
  general_meetings?: GeneralMeeting[];
  general_meeting_records: GeneralMeetingRecord[];
  scanner_devices: any[];
  registration_codes: any[];
}

const DEFAULT_DB: LocalDatabase = {
  users: [
    {
      id: 'user_superadmin_01',
      username: 'admin',
      name: 'أبانوب وجيه',
      role: 'super_admin',
      church_role_title: 'خادم',
      scope: 'all',
      permissions: [
        'view_servants',
        'add_servant',
        'edit_servant',
        'delete_servant',
        'view_servant_details',
        'view_users',
        'add_user',
        'edit_user',
        'disable_user',
        'delete_user',
        'view_services',
        'add_service',
        'edit_service',
        'delete_service',
        'view_attendance',
        'add_attendance',
        'edit_attendance',
        'delete_attendance',
        'view_reports',
        'export_reports',
        'view_history',
        'manage_permissions',
        'manage_roles',
        'full_access',
      ],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  servants: [],
  services: [],
  assignments: [],
  attendance: [],
  audit_logs: [],
  meetings: [],
  general_meetings: [],
  general_meeting_records: [],
  scanner_devices: [],
  registration_codes: [],
};

export function getLocalDb(): LocalDatabase {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy key
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(STORAGE_KEY, legacyRaw);
      }
    }

    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
      return { ...DEFAULT_DB };
    }

    const parsed = JSON.parse(raw);
    const meetings = Array.isArray(parsed.meetings)
      ? parsed.meetings
      : (Array.isArray(parsed.general_meetings) ? parsed.general_meetings : []);

    return {
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEFAULT_DB.users,
      servants: Array.isArray(parsed.servants) ? parsed.servants : [],
      services: Array.isArray(parsed.services) ? parsed.services : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      audit_logs: Array.isArray(parsed.audit_logs) ? parsed.audit_logs : [],
      meetings,
      general_meetings: meetings,
      general_meeting_records: Array.isArray(parsed.general_meeting_records) ? parsed.general_meeting_records : [],
      scanner_devices: Array.isArray(parsed.scanner_devices) ? parsed.scanner_devices : [],
      registration_codes: Array.isArray(parsed.registration_codes) ? parsed.registration_codes : [],
    };
  } catch (e) {
    console.error('Failed to parse local DB, using default:', e);
    return { ...DEFAULT_DB };
  }
}

export const loadLocalDb = getLocalDb;

export function saveLocalDb(db: LocalDatabase) {
  try {
    db.general_meetings = db.meetings;
    const serialized = JSON.stringify(db);
    localStorage.setItem(STORAGE_KEY, serialized);
    // Keep legacy key synced too
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Error saving local db to localStorage:', e);
  }
}

// Helper to format ISO or time to Arabic AM/PM
function formatTimeToArabic(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return isoString;
  }
}

function isPriest(servant: any): boolean {
  const role = (servant.current_role || '').toLowerCase();
  const name = (servant.full_name || servant.name || '').trim();
  return (
    role.includes('كاهن') ||
    role.includes('priest') ||
    name.startsWith('أبونا') ||
    name.startsWith('القمص') ||
    name.startsWith('القس')
  );
}

export async function handleLocalApiFallback(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const url = endpoint.split('?')[0];
  const queryStr = endpoint.includes('?') ? endpoint.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryStr);
  const body = options.body ? JSON.parse(String(options.body)) : {};

  const db = getLocalDb();

  // 1. Auth: /api/auth/login
  if (url === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    const user = db.users.find(
      (u) => u.username.toLowerCase() === (username || '').toLowerCase()
    );

    if (user && (password === 'admin' || password === 'admin123456' || password === '123456' || !user.password_hash || user.password === password)) {
      const token = 'local_token_' + user.id;
      return { success: true, token, user };
    }

    if (username === 'admin' && (password === 'admin' || password === 'admin123456' || password === '123456')) {
      const fallbackUser = db.users[0] || DEFAULT_DB.users[0];
      return { success: true, token: 'local_token_admin', user: fallbackUser };
    }

    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // 2. Auth: /api/auth/me
  if (url === '/api/auth/me' && method === 'GET') {
    const user = db.users[0] || DEFAULT_DB.users[0];
    return { user };
  }

  // 3. Auth: /api/auth/logout
  if (url === '/api/auth/logout') {
    return { success: true };
  }

  // 4. Auth: /api/auth/profile
  if (url === '/api/auth/profile' && method === 'PUT') {
    const user = db.users[0];
    if (user) {
      if (body.name) user.name = body.name.trim();
      if (body.church_role_title !== undefined) user.church_role_title = body.church_role_title.trim();
      saveLocalDb(db);
      return { success: true, user };
    }
    return { success: true };
  }

  // 5. Services: /api/services
  if (url === '/api/services') {
    if (method === 'GET') {
      return { success: true, services: db.services };
    }
    if (method === 'POST') {
      const newService = {
        id: 'srv_' + Date.now(),
        ...body,
        created_at: new Date().toISOString(),
      };
      db.services.push(newService);
      saveLocalDb(db);
      return { success: true, service: newService };
    }
  }

  if (url.startsWith('/api/services/')) {
    const id = url.replace('/api/services/', '');
    if (method === 'PUT') {
      const idx = db.services.findIndex((s) => s.id === id);
      if (idx !== -1) {
        db.services[idx] = { ...db.services[idx], ...body, updated_at: new Date().toISOString() };
        saveLocalDb(db);
        return { success: true, service: db.services[idx] };
      }
    }
    if (method === 'DELETE') {
      db.services = db.services.filter((s) => s.id !== id);
      saveLocalDb(db);
      return { success: true };
    }
  }

  // 6. Servants: /api/servants
  if (url === '/api/servants') {
    if (method === 'GET') {
      let filtered = [...db.servants];
      const serviceId = searchParams.get('service_id');
      const search = searchParams.get('search');
      if (serviceId) {
        filtered = filtered.filter((s) => (s.current_service_id || s.service_id) === serviceId);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            (s.full_name || s.name || '').toLowerCase().includes(q) ||
            (s.national_id || '').includes(search) ||
            (s.phone || s.mobile || '').includes(search)
        );
      }
      // enrich service_name
      filtered = filtered.map((s) => {
        const srv = db.services.find((sv) => sv.id === (s.current_service_id || s.service_id));
        return {
          ...s,
          service_name: srv ? srv.name_ar : (s.service_name || 'غير محدد'),
          attendance_rate: s.attendance_rate !== undefined ? s.attendance_rate : 100,
          total_meetings: s.total_meetings !== undefined ? s.total_meetings : 0,
        };
      });
      return { success: true, servants: filtered };
    }
    if (method === 'POST') {
      const newServant = {
        id: 'servant_' + Date.now(),
        status: 'active',
        attendance_rate: 100,
        total_meetings: 0,
        ...body,
        created_at: new Date().toISOString(),
      };
      db.servants.push(newServant);
      saveLocalDb(db);
      return { success: true, servant: newServant };
    }
  }

  if (url.startsWith('/api/servants/')) {
    const id = url.replace('/api/servants/', '');
    if (method === 'GET') {
      const s = db.servants.find((item) => item.id === id);
      const srv = s ? db.services.find((sv) => sv.id === (s.current_service_id || s.service_id)) : null;
      return {
        success: true,
        servant: s ? { ...s, current_service_name: srv ? srv.name_ar : 'غير محدد' } : null,
        attendance_stats: { total: 0, present: 0, absent: 0, percentage: 100 },
        assignments: [],
        recent_attendance: [],
        has_id_card: Boolean(s?.id_card_photo),
      };
    }
    if (method === 'PUT') {
      const idx = db.servants.findIndex((s) => s.id === id);
      if (idx !== -1) {
        db.servants[idx] = { ...db.servants[idx], ...body, updated_at: new Date().toISOString() };
        saveLocalDb(db);
        return { success: true, servant: db.servants[idx] };
      }
    }
    if (method === 'DELETE') {
      db.servants = db.servants.filter((s) => s.id !== id);
      saveLocalDb(db);
      return { success: true };
    }
  }

  // 7. Meetings: /api/meetings
  if (url === '/api/meetings') {
    if (method === 'GET') {
      const activeServants = db.servants.filter((s) => s.status === 'active' && !isPriest(s));
      const totalEligible = activeServants.length;

      const enriched = (db.meetings || []).map((m) => {
        const records = (db.general_meeting_records || []).filter(
          (r) => r.meeting_id === m.id || r.date === m.date
        );
        const presentCount = records.filter(
          (r) => r.status === 'present' || r.status === 'checked_in' || r.status === 'completed'
        ).length;
        const lateAbsentCount = records.filter((r) => r.status === 'late_absent' || r.is_late).length;
        const recordedIds = new Set(records.map((r) => r.servant_id));
        const notScannedCount = Math.max(0, totalEligible - recordedIds.size);
        const percentage = totalEligible > 0 ? Math.round((presentCount / totalEligible) * 100) : 0;

        return {
          ...m,
          stats: {
            total_eligible: totalEligible,
            present: presentCount,
            late_absent: lateAbsentCount,
            not_scanned: notScannedCount,
            total_absent: lateAbsentCount + notScannedCount,
            attendance_percentage: percentage,
          },
        };
      });

      return {
        success: true,
        meetings: enriched,
        total_eligible_servants: totalEligible,
      };
    }

    if (method === 'POST') {
      const newMeeting: GeneralMeeting = {
        id: 'meeting_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: String(body.title || '').trim(),
        speaker: String(body.speaker || '').trim(),
        date: body.date || new Date().toISOString().split('T')[0],
        start_time: body.start_time || '12:00',
        end_time: body.end_time || '14:00',
        late_cutoff_time: body.late_cutoff_time || '13:00',
        notes: body.notes ? String(body.notes).trim() : '',
        status: 'active',
        created_by_user_id: 'user_superadmin_01',
        created_by_name: 'أبانوب وجيه',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.meetings.unshift(newMeeting);
      saveLocalDb(db);
      return { success: true, meeting: newMeeting };
    }
  }

  if (url === '/api/meetings/today') {
    const today = new Date().toISOString().split('T')[0];
    const meeting = (db.meetings || []).find((m) => m.date === today && m.status !== 'cancelled');
    return { success: true, today, meeting: meeting || null };
  }

  if (url.startsWith('/api/meetings/')) {
    const id = url.replace('/api/meetings/', '');
    const meeting = (db.meetings || []).find((m) => m.id === id);

    if (method === 'GET') {
      if (!meeting) {
        throw new Error('الاجتماع غير موجود');
      }

      const allServants = db.servants.filter((s) => s.status === 'active');
      const records = (db.general_meeting_records || []).filter(
        (r) => r.meeting_id === meeting.id || r.date === meeting.date
      );
      const recordsMap = new Map<string, any>();
      records.forEach((r) => recordsMap.set(r.servant_id, r));

      const roster = allServants.map((servant) => {
        const priestFlag = isPriest(servant);
        const rec = recordsMap.get(servant.id);
        const srv = db.services.find((s) => s.id === (servant.current_service_id || servant.service_id));
        const serviceName = srv ? srv.name_ar : 'غير محدد';

        if (priestFlag) {
          return {
            servant_id: servant.id,
            servant_name: servant.full_name || servant.name,
            servant_phone: servant.phone,
            service_id: servant.current_service_id || servant.service_id,
            service_name: serviceName,
            current_role: servant.current_role || 'أب كاهن',
            status: 'priest_exempt',
            is_priest: true,
            check_in_time: rec?.check_in_time ? formatTimeToArabic(rec.check_in_time) : '',
            check_in_time_raw: rec?.check_in_time || null,
            check_out_time: rec?.check_out_time ? formatTimeToArabic(rec.check_out_time) : '',
            duration_minutes: rec?.duration_minutes,
            scanner_device_name: rec?.scanner_device_name,
          };
        }

        if (rec) {
          let finalStatus = 'present';
          if (rec.status === 'late_absent' || rec.is_late) finalStatus = 'late_absent';
          else if (rec.status === 'completed') finalStatus = 'completed';

          return {
            servant_id: servant.id,
            servant_name: servant.full_name || servant.name,
            servant_phone: servant.phone,
            service_id: servant.current_service_id || servant.service_id,
            service_name: serviceName,
            current_role: servant.current_role,
            status: finalStatus,
            is_late: rec.is_late || rec.status === 'late_absent',
            check_in_time: rec.check_in_time ? formatTimeToArabic(rec.check_in_time) : '',
            check_in_time_raw: rec.check_in_time || null,
            check_out_time: rec.check_out_time ? formatTimeToArabic(rec.check_out_time) : '',
            duration_minutes: rec.duration_minutes,
            scanner_device_name: rec.scanner_device_name,
            notes: rec.notes,
          };
        }

        return {
          servant_id: servant.id,
          servant_name: servant.full_name || servant.name,
          servant_phone: servant.phone,
          service_id: servant.current_service_id || servant.service_id,
          service_name: serviceName,
          current_role: servant.current_role,
          status: 'absent',
          is_late: false,
          check_in_time: '',
          check_in_time_raw: null,
          check_out_time: '',
          duration_minutes: undefined,
          scanner_device_name: undefined,
          notes: 'لم يسجل الحضور',
        };
      });

      const eligibleRoster = roster.filter((r) => !r.is_priest);
      const presentCount = eligibleRoster.filter((r) => r.status === 'present' || r.status === 'completed').length;
      const lateAbsentCount = eligibleRoster.filter((r) => r.status === 'late_absent').length;
      const absentCount = eligibleRoster.filter((r) => r.status === 'absent').length;
      const totalEligible = eligibleRoster.length;
      const percentage = totalEligible > 0 ? Math.round((presentCount / totalEligible) * 100) : 0;

      return {
        success: true,
        meeting,
        stats: {
          total_eligible: totalEligible,
          present: presentCount,
          late_absent: lateAbsentCount,
          absent: absentCount,
          total_absent: lateAbsentCount + absentCount,
          attendance_percentage: percentage,
          priests_count: roster.filter((r) => r.is_priest).length,
        },
        roster,
      };
    }

    if (method === 'PUT') {
      const idx = db.meetings.findIndex((m) => m.id === id);
      if (idx !== -1) {
        db.meetings[idx] = {
          ...db.meetings[idx],
          ...body,
          updated_at: new Date().toISOString(),
        };
        saveLocalDb(db);
        return { success: true, meeting: db.meetings[idx] };
      }
      throw new Error('الاجتماع غير موجود');
    }

    if (method === 'DELETE') {
      db.meetings = (db.meetings || []).filter((m) => m.id !== id);
      db.general_meetings = (db.general_meetings || []).filter((m) => m.id !== id);
      db.general_meeting_records = (db.general_meeting_records || []).filter((r) => r.meeting_id !== id);
      saveLocalDb(db);
      return { success: true };
    }
  }

  // 8. Attendance Sheet: /api/attendance/sheet
  if (url === '/api/attendance/sheet') {
    const serviceId = searchParams.get('service_id');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const service = db.services.find((s) => s.id === serviceId) || { id: serviceId, name_ar: 'الخدمة الكنسية' };

    const matchingServants = db.servants.filter(
      (s) => (s.current_service_id || s.service_id) === serviceId && s.status === 'active'
    );

    const sheet = matchingServants.map((servant) => {
      const existing = (db.attendance || []).find(
        (a) => a.servant_id === servant.id && a.date === date
      );
      return {
        servant_id: servant.id,
        full_name: servant.full_name || servant.name,
        phone: servant.phone,
        attendance_rate: servant.attendance_rate !== undefined ? servant.attendance_rate : 100,
        status: existing?.status || 'present',
        notes: existing?.notes || '',
      };
    });

    return {
      success: true,
      service,
      date,
      sheet,
    };
  }

  // 9. Attendance Save / Bulk: /api/attendance
  if (url === '/api/attendance/bulk' && method === 'POST') {
    if (Array.isArray(body.records)) {
      body.records.forEach((rec: any) => {
        const existingIdx = db.attendance.findIndex(
          (a) => a.servant_id === rec.servant_id && a.date === rec.date
        );
        if (existingIdx !== -1) {
          db.attendance[existingIdx] = { ...db.attendance[existingIdx], ...rec };
        } else {
          db.attendance.push({
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            ...rec,
          });
        }
      });
      saveLocalDb(db);
    }
    return { success: true, count: body.records?.length || 0 };
  }

  // 10. Users: /api/users
  if (url === '/api/users') {
    if (method === 'GET') {
      return { success: true, users: db.users };
    }
    if (method === 'POST') {
      const newUser = {
        id: 'user_' + Date.now(),
        ...body,
        status: body.status || 'active',
        created_at: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveLocalDb(db);
      return { success: true, user: newUser };
    }
  }

  if (url.startsWith('/api/users/')) {
    const id = url.replace('/api/users/', '').split('/')[0];
    if (method === 'PUT') {
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...body, updated_at: new Date().toISOString() };
        saveLocalDb(db);
        return { success: true, user: db.users[idx] };
      }
    }
    if (method === 'DELETE') {
      db.users = db.users.filter((u) => u.id !== id);
      saveLocalDb(db);
      return { success: true };
    }
  }

  // 11. Scanner: /api/scanner/scan
  if (url === '/api/scanner/scan' && method === 'POST') {
    const { servant_id, meeting_id, mode } = body;
    const servant = db.servants.find((s) => s.id === servant_id || s.national_id === servant_id);
    if (!servant) {
      throw new Error('الخادم غير مسجل في المنظومة');
    }

    const meeting = meeting_id ? db.meetings.find((m) => m.id === meeting_id) : db.meetings[0];
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5); // HH:MM
    const cutoff = meeting?.late_cutoff_time || '13:00';
    const isLate = nowTime > cutoff;
    const status = isLate ? 'late_absent' : 'present';

    const newRec = {
      id: 'gmr_' + Date.now(),
      meeting_id: meeting?.id || 'meeting_general',
      servant_id: servant.id,
      servant_name: servant.full_name,
      servant_phone: servant.phone,
      date: meeting?.date || now.toISOString().split('T')[0],
      check_in_time: now.toISOString(),
      status: status as any,
      is_late: isLate,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    db.general_meeting_records.push(newRec as any);
    saveLocalDb(db);

    return {
      success: true,
      servant,
      record: newRec,
      is_late: isLate,
      status,
      message: isLate
        ? `تم تسجيل الحضور متأخراً بعد الساعة ${cutoff} (غياب تأخير)`
        : 'تم تسجيل الحضور بنجاح في الموعد',
    };
  }

  if (url === '/api/scanner/devices') {
    return { success: true, devices: db.scanner_devices || [] };
  }

  // 12. Dashboard Reports: /api/reports/dashboard
  if (url === '/api/reports/dashboard') {
    return {
      success: true,
      stats: {
        totalServants: db.servants.length,
        totalServices: db.services.length,
        totalUsers: db.users.length,
        attendanceRate: 100,
        activeServants: db.servants.length,
        inactiveServants: 0,
        priestsCount: db.servants.filter((s) => isPriest(s)).length,
        topServices: db.services.slice(0, 5),
        recentActivity: [],
      },
    };
  }

  // 13. Audit: /api/audit
  if (url === '/api/audit') {
    return { success: true, total: db.audit_logs.length, logs: db.audit_logs };
  }

  // 14. Portal: /api/portal/verify
  if (url === '/api/portal/verify' && method === 'POST') {
    const { national_id } = body;
    const servant = db.servants.find((s) => s.national_id === national_id);
    if (!servant) {
      throw new Error('الرقم القومي غير مسجل في منظومة الخدام');
    }
    return {
      success: true,
      data: {
        servant,
        service: db.services.find((s) => s.id === (servant.current_service_id || servant.service_id)) || null,
        attendance_stats: { total: 0, present: 0, percentage: 100 },
        recent_attendance: [],
      },
    };
  }

  return { success: true };
}
