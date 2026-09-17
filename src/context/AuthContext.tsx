import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, PermissionKey } from '../types/index.js';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccessService: (serviceId?: string) => boolean;
  isSuperAdmin: boolean;
  isPriest: boolean;
  isGeneralSecretary: boolean;
  isStageCoordinator: boolean;
  isServant: boolean;
  isCaptain: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('Authentication token expired or invalid');
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (username: string, password: string): Promise<void> => {
    const data = await api.post<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      username,
      password,
    });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      if (!user) return false;
      if (user.role === 'super_admin' || user.role === 'priest' || user.permissions.includes('full_access')) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const canAccessService = useCallback(
    (serviceId?: string): boolean => {
      if (!user) return false;
      if (
        user.role === 'super_admin' ||
        user.role === 'priest' ||
        user.role === 'general_secretary' ||
        user.scope === 'all' ||
        !serviceId
      ) {
        return true;
      }
      return user.scope === serviceId;
    },
    [user]
  );

  const isSuperAdmin = user?.role === 'super_admin';
  const isPriest = user?.role === 'priest';
  const isGeneralSecretary = user?.role === 'general_secretary';
  const isStageCoordinator = user?.role === 'stage_coordinator';
  const isServant = user?.role === 'servant';
  const isCaptain = user?.role === 'captain';
  const isViewer = user?.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        hasPermission,
        canAccessService,
        isSuperAdmin,
        isPriest,
        isGeneralSecretary,
        isStageCoordinator,
        isServant,
        isCaptain,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
