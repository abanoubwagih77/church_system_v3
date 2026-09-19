import { handleLocalApiFallback, loadLocalDb } from './localFallback.js';

const TOKEN_KEY = 'church_admin_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Background sync helper to restore client records to server if needed
let lastSyncTime = 0;
async function tryBackgroundSyncToServer() {
  const now = Date.now();
  if (now - lastSyncTime < 15000) return; // limit sync calls to at most once per 15s
  lastSyncTime = now;

  try {
    const token = getAuthToken();
    if (!token) return;
    const db = loadLocalDb();
    if (!db.servants.length && !db.meetings.length && !db.services.length) return;

    fetch('/api/sync/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        servants: db.servants,
        meetings: db.meetings,
        services: db.services,
        general_meeting_records: db.general_meeting_records,
      }),
    }).catch(() => {});
  } catch {
    // silent background sync
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();

  // 1. Immediately persist non-GET write actions to local storage
  if (method !== 'GET') {
    try {
      await handleLocalApiFallback(endpoint, options);
    } catch (e) {
      console.warn('Local fallback immediate write warning:', e);
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // If server responds with 404/405/502/504 (e.g. static hosting on Vercel where Express backend is not serving)
    if (response.status === 404 || response.status === 405 || response.status === 502 || response.status === 504) {
      return (await handleLocalApiFallback(endpoint, options)) as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If unauthorized or specific error on static/lambda host
      if (response.status === 500 && (data.error?.includes('database') || !data.error)) {
        return (await handleLocalApiFallback(endpoint, options)) as T;
      }
      const errorMessage = data.error || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // 2. CRITICAL PERSISTENCE SAFEGUARD for GET operations:
    // When hosted on Vercel or ephemeral serverless environments, cold starts may return empty seed data
    // While the client's localStorage has the user's authentic saved records.
    if (method === 'GET' && data && typeof data === 'object') {
      const anyData = data as any;
      const db = loadLocalDb();

      // Check Servants persistence
      if (
        endpoint.startsWith('/api/servants') &&
        endpoint === '/api/servants' &&
        Array.isArray(anyData.servants) &&
        anyData.servants.length === 0 &&
        db.servants.length > 0
      ) {
        anyData.servants = db.servants;
        tryBackgroundSyncToServer();
      }

      // Check Meetings persistence
      if (
        endpoint.startsWith('/api/meetings') &&
        endpoint === '/api/meetings' &&
        Array.isArray(anyData.meetings) &&
        anyData.meetings.length === 0 &&
        db.meetings.length > 0
      ) {
        anyData.meetings = db.meetings;
        tryBackgroundSyncToServer();
      }

      // Check Services persistence
      if (
        endpoint === '/api/services' &&
        Array.isArray(anyData.services) &&
        anyData.services.length === 0 &&
        db.services.length > 0
      ) {
        anyData.services = db.services;
        tryBackgroundSyncToServer();
      }

      // Check single meeting details fallback
      if (endpoint.startsWith('/api/meetings/') && endpoint !== '/api/meetings') {
        if (!anyData.success || !anyData.meeting) {
          const localMeetingDetails = await handleLocalApiFallback(endpoint, options).catch(() => null);
          if (localMeetingDetails) return localMeetingDetails as T;
        }
      }
    }

    return data as T;
  } catch (err: any) {
    // If network error (e.g. offline or failed to fetch on static host)
    console.warn(`Network or API exception on ${endpoint}. Using local persistent storage:`, err.message);
    return (await handleLocalApiFallback(endpoint, options)) as T;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
