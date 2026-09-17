import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  Menu,
  X,
  Globe,
  Sun,
  Moon,
  LogOut,
  User,
  Cross,
  Search,
  QrCode,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  currentTab,
  setCurrentTab,
}) => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Left / Start: Branding & Mobile Drawer Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {user && onToggleSidebar && (
              <button
                id="btn-toggle-sidebar"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="القائمة الجانبية"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* St. George Emblem & Church Title */}
            <div
              className="flex items-center gap-2.5 cursor-pointer min-w-0 select-none"
              onClick={() => setCurrentTab(user ? 'dashboard' : 'portal')}
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-amber-600 shadow-sm shrink-0 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <img
                  src="/st-george.jpg"
                  alt="Saint George"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Cross className="w-5 h-5 text-amber-500 absolute pointer-events-none opacity-50" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white leading-tight font-serif truncate max-w-[180px] xs:max-w-[220px] sm:max-w-xs md:max-w-md">
                  {t('church_name')}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-semibold truncate">
                  {t('app_title')}
                </span>
              </div>
            </div>
          </div>

          {/* Right / End: Tools & User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Switch to Servant Portal */}
            <button
              id="btn-nav-servant-portal"
              onClick={() => setCurrentTab('portal')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                currentTab === 'portal'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title="بوابة استعلام الخدام"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('nav_portal')}</span>
              <span className="sm:hidden text-[11px]">الاستعلام</span>
            </button>

            {/* Attendance QR Scanner */}
            <button
              id="btn-nav-attendance-scanner"
              onClick={() => setCurrentTab('scanner')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                currentTab === 'scanner'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/40'
              }`}
              title="سكانر تسجيل الحضور والانصراف بالـ QR"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">سكانر الحضور</span>
              <span className="sm:hidden text-[11px]">سكانر</span>
            </button>

            {/* Dark / Light Mode Toggle with text indicator */}
            <button
              id="btn-nav-toggle-theme"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'التحويل للوضع النهاري (Light Mode)' : 'التحويل للوضع الليلي (Dark Mode)'}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer min-h-[38px]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden md:inline text-[11px] font-semibold">نهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-stone-700 shrink-0" />
                  <span className="hidden md:inline text-[11px] font-semibold">ليلي</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              id="btn-nav-toggle-lang"
              onClick={toggleLanguage}
              title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer min-h-[38px]"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="uppercase text-[11px]">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Authenticated User Status or Login button */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 ps-1 sm:ps-2 border-s border-stone-200 dark:border-stone-800">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                    {user.role === 'super_admin' ? t('role_super_admin') : user.role}
                  </span>
                </div>
                <button
                  id="btn-nav-logout"
                  onClick={logout}
                  title={t('nav_logout')}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              currentTab !== 'login' && (
                <button
                  id="btn-nav-login"
                  onClick={() => setCurrentTab('login')}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('nav_login')}</span>
                  <span className="sm:hidden text-[11px]">دخول</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
