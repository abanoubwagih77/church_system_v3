import { User, ChurchService, Servant, ServiceAssignment, AttendanceRecord, AuditLog } from '../types/index.js';

const STORAGE_KEY = 'st_george_local_church_db_v1';

interface LocalDatabase {
  users: any[];
  servants: any[];
  services: any[];
  assignments: any[];
  attendance: any[];
  audit_logs: any[];
  meetings: any[];
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
};

function getLocalDb(): LocalDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DB;
  }
}

function saveLocalDb(db: LocalDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving local db:', e);
  }
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

    // Accept default admin / admin or password check
    if (user && (password === 'admin' || password === 'admin123456' || password === '123456' || !user.password_hash)) {
      const token = 'mock_jwt_token_' + user.id;
      return { success: true, token, user };
    }

    if (username === 'admin' && (password === 'admin' || password === 'admin123456')) {
      const fallbackUser = db.users[0] || DEFAULT_DB.users[0];
      return { success: true, token: 'mock_jwt_token_admin', user: fallbackUser };
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
        filtered = filtered.filter((s) => s.service_id === serviceId);
      }
      if (search) {
        filtered = filtered.filter(
          (s) =>
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.national_id?.includes(search) ||
            s.mobile?.includes(search)
        );
      }
      return { success: true, servants: filtered };
    }
    if (method === 'POST') {
      const newServant = {
        id: 'servant_' + Date.now(),
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
      return {
        success: true,
        servant: s || null,
        attendance_stats: { total: 0, present: 0, absent: 0, percentage: 100 },
        assignments: [],
        recent_attendance: [],
        has_id_card: true,
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

  // 7. Users: /api/users
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
    const id = url.replace('/api/users/', '');
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

  // 8. Dashboard Reports: /api/reports/dashboard
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
        priestsCount: 0,
        topServices: db.services.slice(0, 5),
        recentActivity: [],
      },
    };
  }

  // 9. Attendance: /api/attendance
  if (url === '/api/attendance/bulk' && method === 'POST') {
    if (Array.isArray(body.records)) {
      db.attendance.push(...body.records);
      saveLocalDb(db);
    }
    return { success: true, count: body.records?.length || 0 };
  }

  // 10. Audit: /api/audit
  if (url === '/api/audit') {
    return { success: true, total: db.audit_logs.length, logs: db.audit_logs };
  }

  // 11. Portal: /api/portal/verify
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
        service: db.services.find((s) => s.id === servant.service_id) || null,
        attendance_stats: { total: 0, present: 0, percentage: 100 },
        recent_attendance: [],
      },
    };
  }

  // Fallback default response
  return { success: true };
}
