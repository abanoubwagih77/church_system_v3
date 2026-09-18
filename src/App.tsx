import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Sidebar } from './components/common/Sidebar.js';
import { Dashboard } from './components/dashboard/Dashboard.js';
import { ServantsList } from './components/servants/ServantsList.js';
import { AttendanceSheet } from './components/attendance/AttendanceSheet.js';
import { MeetingsManager } from './components/meetings/MeetingsManager.js';
import { ServicesList } from './components/services/ServicesList.js';
import { UsersList } from './components/users/UsersList.js';
import { AuditHistory } from './components/audit/AuditHistory.js';
import { ReportsView } from './components/reports/ReportsView.js';
import { ServantPortal } from './components/portal/ServantPortal.js';
import { WelcomeLanding } from './components/home/WelcomeLanding.js';
import { LoginView } from './components/auth/LoginView.js';
import { ScannerDeviceView } from './components/scanner/ScannerDeviceView.js';
import { ScannerManagementModal } from './components/scanner/ScannerManagementModal.js';
import { ForceChangePasswordModal } from './components/auth/ForceChangePasswordModal.js';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerManagerOpen, setIsScannerManagerOpen] = useState(false);
  const [servantsInitialAction, setServantsInitialAction] = useState<string | undefined>(undefined);

  // If initial load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500 font-serif">
            كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر
          </span>
        </div>
      </div>
    );
  }

  // Handle navigation from dashboard buttons
  const handleNavigate = (tab: string, action?: string) => {
    setCurrentTab(tab);
    if (tab === 'servants' && action === 'add') {
      setServantsInitialAction('add');
    }
  };

  // If user is not authenticated:
  // Shows Church Welcome & Servants Landing with scripture verse, or Portal, Login, Scanner
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={(tab) => setCurrentTab(tab)}
        />
        <main className="flex-1">
          {currentTab === 'login' && (
            <LoginView
              onSuccess={() => setCurrentTab('dashboard')}
              onOpenPortal={() => setCurrentTab('portal')}
              onBackToHome={() => setCurrentTab('dashboard')}
            />
          )}
          {currentTab === 'portal' && (
            <ServantPortal onBack={() => setCurrentTab('dashboard')} />
          )}
          {currentTab === 'scanner' && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
              <ScannerDeviceView onBackToMain={() => setCurrentTab('dashboard')} />
            </div>
          )}
          {currentTab !== 'login' && currentTab !== 'portal' && currentTab !== 'scanner' && (
            <WelcomeLanding
              onNavigateToLogin={() => setCurrentTab('login')}
              onNavigateToPortal={() => setCurrentTab('portal')}
              onNavigateToScanner={() => setCurrentTab('scanner')}
            />
          )}
        </main>
      </div>
    );
  }

  // Authenticated Management View
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Force Password Change Modal if must_change_password is true */}
      {user.must_change_password && <ForceChangePasswordModal />}

      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        currentTab={currentTab}
        setCurrentTab={(tab) => setCurrentTab(tab)}
      />

      <div className="flex-1 flex w-full">
        {/* Sidebar only shown on management tabs (except full-screen scanner) */}
        {currentTab !== 'portal' && currentTab !== 'scanner' && (
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={(tab) => setCurrentTab(tab)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenScannerManager={() => setIsScannerManagerOpen(true)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentTab === 'servants' && (
            <ServantsList
              initialOpenAdd={servantsInitialAction === 'add'}
              onClearInitialAdd={() => setServantsInitialAction(undefined)}
            />
          )}
          {currentTab === 'attendance' && (
            <AttendanceSheet onNavigateToMeetings={() => setCurrentTab('meetings')} />
          )}
          {currentTab === 'meetings' && (
            <MeetingsManager onNavigateToScanner={() => setCurrentTab('scanner')} />
          )}
          {currentTab === 'scanner' && (
            <ScannerDeviceView onBackToMain={() => setCurrentTab('dashboard')} />
          )}
          {currentTab === 'services' && <ServicesList />}
          {currentTab === 'users' && <UsersList />}
          {currentTab === 'audit' && <AuditHistory />}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'portal' && <ServantPortal />}
        </main>
      </div>

      {/* Scanner Management Modal for Priest / Admin */}
      <ScannerManagementModal
        isOpen={isScannerManagerOpen}
        onClose={() => setIsScannerManagerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
