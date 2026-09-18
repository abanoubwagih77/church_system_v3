import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import {
  Shield,
  Search,
  QrCode,
  Cross,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface WelcomeLandingProps {
  onNavigateToLogin: () => void;
  onNavigateToPortal: () => void;
  onNavigateToScanner: () => void;
}

export const WelcomeLanding: React.FC<WelcomeLandingProps> = ({
  onNavigateToLogin,
  onNavigateToPortal,
  onNavigateToScanner,
}) => {
  const { language, isRtl } = useLanguage();

  return (
    <div className="min-h-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* Hero Church Header */}
      <div className="text-center space-y-4 relative">
        <div className="inline-flex items-center justify-center p-2.5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-lg relative group">
          <img
            src="/st-george.jpg"
            alt="الشهيد العظيم مارجرجس"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-600 shadow-md transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white p-1.5 rounded-full shadow-md">
            <Cross className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-bold">
            <Cross className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            <span>كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white font-serif tracking-tight leading-tight">
            أهلاً بكم في نظام إدارة خدمة الكنيسة
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            المنظومة الرقمية الموحدة لمتابعة وتنظيم خدمات الكنيسة، وتوثيق سجلات وبيانات الخدام،
            وإدارة الحضور والانصراف والكارنيهات الذكية بدقة ومحبة.
          </p>
        </div>
      </div>

      {/* Scripture Verse Card (آية من الكتاب المقدس) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-amber-700/15 border-2 border-amber-300/70 dark:border-amber-700/50 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
          <div className="w-14 h-14 rounded-2xl bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>آية اليوم للخدام والخدمة</span>
            </div>
            <p className="text-base sm:text-lg lg:text-xl font-bold font-serif text-stone-900 dark:text-amber-100 leading-relaxed">
              «لأَنَّ اللهَ لَيْسَ بِظَالِمٍ حَتَّى يَنْسَى عَمَلَكُمْ وَتَعَبَ الْمَحَبَّةِ الَّتِي أَظْهَرْتُمُوهَا نَحْوَ اسْمِهِ، إِذْ قَدْ خَدَمْتُمُ الْقِدِّيسِينَ وَتَخْدِمُونَهُمْ»
            </p>
            <p className="text-xs sm:text-sm font-semibold text-amber-800/90 dark:text-amber-300/90 font-serif">
              — رسالة بولس الرسول إلى العبرانيين (٦ : ١٠)
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Portals (أزرار وبطاقات الوصول المباشر) */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white font-serif">
            اختر البوابة المناسبة للدخول
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            يمكنك تسجيل دخول الإدارة، أو الاستعلام عن بياناتك كخادم، أو مسح باركود الحضور
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Management Login */}
          <div
            id="card-portal-login"
            onClick={onNavigateToLogin}
            className="group relative bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border-2 border-stone-200 dark:border-stone-800 hover:border-amber-600 dark:hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-700/10 dark:bg-amber-400/10 border border-amber-600/30 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white font-serif group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  دخول الإدارة وأمناء الخدمة
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                  تسجيل الدخول باسم المستخدم وكلمة المرور لإدارة بيانات الخدام، كشوف الحضور والغياب، الاجتماعات العامة، والتقارير.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>دخول الإدارة</span>
              </span>
              {isRtl ? (
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </div>

          {/* Card 2: Servant Portal */}
          <div
            id="card-portal-servants"
            onClick={onNavigateToPortal}
            className="group relative bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border-2 border-stone-200 dark:border-stone-800 hover:border-blue-600 dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-700/10 dark:bg-blue-400/10 border border-blue-600/30 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white font-serif group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  بوابة الخدام (بالرقم القومي)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                  مخصصة لكل خادم بالكنسية للاستعلام الفوري بالرقم القومي، وتحميل كارنيه الخدمة الذكي بالـ QR، واستعراض نسبة الحضور.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>فتح بوابة الخدام</span>
              </span>
              {isRtl ? (
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </div>

          {/* Card 3: Attendance Scanner */}
          <div
            id="card-portal-scanner"
            onClick={onNavigateToScanner}
            className="group relative bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border-2 border-stone-200 dark:border-stone-800 hover:border-purple-600 dark:hover:border-purple-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-700/10 dark:bg-purple-400/10 border border-purple-600/30 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white font-serif group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                  سكانر تسجيل الحضور (QR)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                  تشغيل قارئ الباركود أو كاميرا الجهاز لمسح كارنيهات الخدام وتسجيل الحضور والانصراف تلقائياً في الاجتماعات.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>تشغيل السكانر</span>
              </span>
              {isRtl ? (
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Features & Introduction for Servants (تعريف بالنظام للخدام) */}
      <div className="bg-stone-100/80 dark:bg-stone-900/60 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-6">
        <div className="max-w-2xl">
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-serif flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>ما يقدمه نظام خدمة كنيسة مارجرجس</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
            صُمم النظام لتيسير خدمة الكنيسة ورفع كفاءة التنسيق بين أمانة الخدمة والآباء والخدام:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              كارنيه إلكتروني مشفر
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              توليد بطاقات خدمة رقمية لكل خادم تحمل كود QR خاص به للتعريف ومسح الحضور.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              اجتماعات الخدام والمواعيد
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              تحديد مواعيد إغلاق التسجيل، توثيق الحضور المتأخر بالدقيقة، وساعات التواجد بالاجتماع.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Cross className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              استثناء وتكريم الآباء الكهنة
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              إعفاء الآباء الكهنة تلقائياً من نسب الغياب مع الترحيب بهم كنسياً في النظام.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              تقارير وإحصائيات دقيقة
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              تصدير كشوف Excel، متابعة نسب الالتزام، وتسهيل الافتقاد الدوري للخدام.
            </p>
          </div>
        </div>
      </div>

      {/* Church Footer Quote */}
      <div className="text-center pt-4 pb-2 text-xs text-stone-500 dark:text-stone-400 space-y-1">
        <p className="font-serif font-bold text-stone-700 dark:text-stone-300">
          «كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ كُلَّ حِينٍ»
        </p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          كنيسة الشهيد العظيم مارجرجس — منية شبين القناطر
        </p>
      </div>
    </div>
  );
};
