import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Shield, Lock, User, AlertCircle, ArrowLeft, ArrowRight, Cross } from 'lucide-react';

interface LoginViewProps {
  onSuccess: () => void;
  onOpenPortal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onOpenPortal }) => {
  const { login } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(language === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. تأكد من صحة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 dark:border-stone-800 relative overflow-hidden">
        {/* Decorative Top Church Accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />

        {/* Church Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2 rounded-2xl bg-amber-950/10 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-700/30 mb-3 shadow-xs">
            <img
              src="/st-george.jpg"
              alt="الشهيد العظيم مارجرجس"
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-600 shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white font-serif">
            {t('church_name')}
          </h2>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
            {t('nav_login')} - {t('app_title')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {language === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative">
              <input
                id="input-login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
              />
              <User className="w-4 h-4 text-stone-400 absolute end-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="input-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute end-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>{t('nav_login')}</span>
              </>
            )}
          </button>
        </form>

        {/* Super Admin Notice */}
        <div className="mt-5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-300">
          <div className="font-bold flex items-center gap-1 mb-0.5">
            <Cross className="w-3 h-3 text-amber-700" />
            <span>{language === 'ar' ? 'بيانات الدخول الأولية للمدير العام (Super Admin):' : 'Initial Super Admin Credentials:'}</span>
          </div>
          <div className="font-mono text-[11px] text-stone-700 dark:text-stone-300 space-y-0.5" dir="ltr">
            <div>Username: <strong className="text-amber-800 dark:text-amber-200">admin</strong></div>
            <div>Password: <strong className="text-amber-800 dark:text-amber-200">admin123456</strong></div>
          </div>
          <div className="mt-1 text-[10px] text-amber-700/80 dark:text-amber-400/80">
            {language === 'ar'
              ? 'النظام مهيأ بدون أي بيانات وهمية (فقط حسابك كـ Super Admin). يمكنك تغيير كلمة المرور فور الدخول وإضافة الآباء والخدام.'
              : 'Zero fake data is present. Only the initial Super Admin account is created. You can change your password and add priests and servants.'}
          </div>
        </div>

        {/* Switch to Servant Portal button */}
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 text-center">
          <button
            id="btn-login-to-portal"
            onClick={onOpenPortal}
            className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
          >
            <span>{language === 'ar' ? 'هل أنت خادم؟ ادخل بالرقم القومي عبر بوابة الخدام' : 'Are you a servant? Access via Servant Portal'}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
