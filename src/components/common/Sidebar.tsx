import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  LayoutDashboard,
  Users,
  Layers,
  CalendarCheck,
  Calendar,
  ShieldCheck,
  History,
  FileSpreadsheet,
  ExternalLink,
  ShieldAlert,
  QrCode,
  Smartphone,
  Sun,
  Moon,
  Globe,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenScannerManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  onClose,
  onOpenScannerManager,
}) => {
  const { user, hasPermission } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav_dashboard'),
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'servants',
      label: t('nav_servants'),
      icon: Users,
      visible: hasPermission('view_servants'),
    },
    {
      id: 'meetings',
      label: 'اجتماعات الخدام',
      icon: Calendar,
      visible: hasPermission('view_attendance'),
    },
    {
      id: 'attendance',
      label: t('nav_attendance'),
      icon: CalendarCheck,
      visible: hasPermission('view_attendance'),
    },
    {
      id: 'scanner',
      label: 'سكانر الحضور (QR)',
      icon: QrCode,
      visible: true,
    },
    {
      id: 'services',
      label: t('nav_services'),
      icon: Layers,
      visible: hasPermission('view_services'),
    },
    {
      id: 'reports',
      label: t('nav_reports'),
      icon: FileSpreadsheet,
      visible: hasPermission('view_reports'),
    },
    {
      id: 'users',
      label: t('nav_users'),
      icon: ShieldCheck,
      visible: hasPermission('view_users'),
    },
    {
      id: 'audit',
      label: t('nav_audit'),
      icon: History,
      visible: hasPermission('view_history'),
    },
  ];

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-stone-900 shadow-2xl flex flex-col border-e border-stone-200 dark:border-stone-800 transition-all duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'hidden lg:flex lg:static lg:w-64 lg:shrink-0 lg:shadow-none'
        } lg:min-h-[calc(100vh-4rem)]`}
      >
        {/* Mobile Header with close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <span className="text-xs font-bold text-stone-900 dark:text-white font-serif">
            قائمة النظام الكنسي
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Scope Banner */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-950/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate">
              {user.name}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>
              {user.role === 'super_admin' ? t('role_super_admin') : user.role}
            </span>
            <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
              {user.scope === 'all' ? t('scope_all') : t('scope_specific')}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-700 text-white font-semibold shadow-xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
        </nav>

        {/* Mobile quick tools (Theme & Language) */}
        <div className="lg:hidden p-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>نهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-stone-700" />
                <span>ليلي</span>
              </>
            )}
          </button>
          <button
            onClick={toggleLanguage}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>

        {/* Device Scanner Manager Button for Priest / SuperAdmin / GeneralSecretary */}
        {(user.role === 'super_admin' || user.role === 'priest' || user.role === 'general_secretary') && onOpenScannerManager && (
          <div className="p-3 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => {
                onOpenScannerManager();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-900/50 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>توثيق الهواتف (كود 10 د)</span>
              </span>
            </button>
          </div>
        )}

        {/* Bottom shortcut to Servant Portal */}
        <div className="p-3 border-t border-stone-100 dark:border-stone-800">
          <button
            id="sidebar-btn-open-portal"
            onClick={() => handleSelect('portal')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              {t('nav_portal')}
            </span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </button>
        </div>
      </aside>
    </>
  );
};
