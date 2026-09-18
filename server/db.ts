import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Servant,
  ChurchService,
  ServiceAssignment,
  AttendanceRecord,
  AuditLog,
  ScannerDevice,
  DeviceRegistrationCode,
  GeneralMeetingRecord,
  GeneralMeeting,
} from '../src/types/index.js';

export interface DatabaseSchema {
  users: User[];
  servants: Servant[];
  services: ChurchService[];
  assignments: ServiceAssignment[];
  attendance: AttendanceRecord[];
  audit_logs: AuditLog[];
  scanner_devices: ScannerDevice[];
  registration_codes: DeviceRegistrationCode[];
  general_meeting_records: GeneralMeetingRecord[];
  general_meetings: GeneralMeeting[];
  rate_limits: Record<string, { count: number; reset_time: number }>;
}

// In Vercel serverless environment, the filesystem is read-only except for /tmp
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'database.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbData: DatabaseSchema;

export function initDatabase(): void {
  // If in Vercel and /tmp/database.json doesn't exist yet, copy from seed data
  if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(SEED_FILE)) {
    try {
      fs.copyFileSync(SEED_FILE, DB_FILE);
    } catch (e) {
      console.warn('Could not copy seed database to /tmp:', e);
    }
  }

  const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(SEED_FILE) ? SEED_FILE : null);

  if (targetFile && fs.existsSync(targetFile)) {
    try {
      const content = fs.readFileSync(targetFile, 'utf-8');
      dbData = JSON.parse(content);
      if (!dbData.scanner_devices) dbData.scanner_devices = [];
      if (!dbData.registration_codes) dbData.registration_codes = [];
      if (!dbData.general_meeting_records) dbData.general_meeting_records = [];
      if (!dbData.general_meetings) dbData.general_meetings = [];

      // If admin user exists and password is old default, or explicitly update admin password to 'admin'
      const adminUser = dbData.users?.find((u) => u.username.toLowerCase() === 'admin');
      if (adminUser && !bcrypt.compareSync('admin', adminUser.password_hash || '')) {
        // If password is still admin123456 or initial, set to 'admin' as requested
        if (bcrypt.compareSync('admin123456', adminUser.password_hash || '')) {
          adminUser.password_hash = bcrypt.hashSync('admin', bcrypt.genSaltSync(10));
          saveDatabase();
        }
      }
      return;
    } catch (e) {
      console.error('Failed to read existing database.json, initializing fresh', e);
    }
  }

  // Initialize state with strictly ONLY Super Admin user, 0 services, and 0 servants
  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('admin', defaultSalt);

  const superAdminUser: User = {
    id: 'user_superadmin_01',
    username: 'admin',
    name: 'المدير العام (Super Admin)',
    role: 'super_admin',
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
      'manage_scanner',
      'full_access',
    ],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    password_hash: defaultHash,
  };

  const initialAuditLog: AuditLog = {
    id: `audit_${Date.now()}`,
    username: 'system',
    action: 'SYSTEM_INITIALIZATION',
    target_type: 'SYSTEM',
    target_name: 'نظام إدارة خدام الكنيسة',
    description: 'تمت تهيئة قاعدة البيانات بنجاح بحساب المدير العام فقط (Super Admin) دون أي خدمات أو خدام افتراضية',
    timestamp: new Date().toISOString(),
  };

  dbData = {
    users: [superAdminUser],
    servants: [],
    services: [],
    assignments: [],
    attendance: [],
    audit_logs: [initialAuditLog],
    scanner_devices: [],
    registration_codes: [],
    general_meeting_records: [],
    general_meetings: [],
    rate_limits: {},
  };

  saveDatabase();
}

export function saveDatabase(): void {
  try {
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbData, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (e) {
    console.error('Error saving database:', e);
  }
}

export function getDb(): DatabaseSchema {
  if (!dbData) {
    initDatabase();
  }
  return dbData;
}
