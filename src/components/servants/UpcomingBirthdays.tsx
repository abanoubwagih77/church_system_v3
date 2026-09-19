import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { Servant, ChurchService } from '../../types/index.js';
import {
  Cake,
  Calendar,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Users,
  Sparkles,
  ChevronLeft,
  PartyPopper,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface BirthdayServant extends Servant {
  daysUntilBirthday: number;
  nextBirthdayDate: Date;
  nextAge: number;
  formattedBirthday: string;
  service_name?: string;
}

export const UpcomingBirthdays: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'next30' | 'this_week' | 'this_month' | 'all'>('next30');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servantsRes, servicesRes] = await Promise.all([
        api.get<{ success: boolean; servants: Servant[] }>('/api/servants'),
        api.get<{ success: boolean; services: ChurchService[] }>('/api/services'),
      ]);

      if (servantsRes && servantsRes.servants) {
        setServants(servantsRes.servants);
      }
      if (servicesRes && servicesRes.services) {
        setServices(servicesRes.services);
      }
    } catch (err) {
      console.error('Failed to load birthdays data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute upcoming birthdays
  const birthdayServants: BirthdayServant[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const list: BirthdayServant[] = [];

    servants.forEach((s) => {
      if (!s.date_of_birth) return;
      const dob = new Date(s.date_of_birth);
      if (isNaN(dob.getTime())) return;

      const birthMonth = dob.getMonth(); // 0-indexed
      const birthDay = dob.getDate();
      const birthYear = dob.getFullYear();

      // Determine next birthday
      let nextBirthday = new Date(currentYear, birthMonth, birthDay);
      nextBirthday.setHours(0, 0, 0, 0);

      // If already passed this year, next birthday is next year
      if (nextBirthday.getTime() < today.getTime()) {
        nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
      }

      const diffTime = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const nextAge = nextBirthday.getFullYear() - birthYear;

      const formatted = nextBirthday.toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'long',
      });

      const srvName =
        services.find((sv) => sv.id === s.current_service_id)?.name_ar || (s as any).service_name || '';

      list.push({
        ...s,
        daysUntilBirthday: daysUntil,
        nextBirthdayDate: nextBirthday,
        nextAge,
        formattedBirthday: formatted,
        service_name: srvName,
      });
    });

    // Sort ascending by days until birthday
    return list.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }, [servants, services]);

  // Filtered list
  const filteredList = useMemo(() => {
    return birthdayServants.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.full_name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.includes(q);
        const matchService = (item.service_name || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchService) return false;
      }

      // Service Filter
      if (selectedServiceId !== 'all') {
        const srvId = item.current_service_id || (item as any).service_id;
        if (srvId !== selectedServiceId) return false;
      }

      // Time Range Filter
      if (activeFilter === 'this_week') {
        return item.daysUntilBirthday <= 7;
      } else if (activeFilter === 'next30') {
        return item.daysUntilBirthday <= 30;
      } else if (activeFilter === 'this_month') {
        const today = new Date();
        return (
          item.nextBirthdayDate.getMonth() === today.getMonth() &&
          item.nextBirthdayDate.getFullYear() === today.getFullYear()
        );
      }

      return true;
    });
  }, [birthdayServants, searchQuery, selectedServiceId, activeFilter]);

  // Statistics
  const todayBirthdaysCount = birthdayServants.filter((s) => s.daysUntilBirthday === 0).length;
  const weekBirthdaysCount = birthdayServants.filter((s) => s.daysUntilBirthday <= 7).length;
  const monthBirthdaysCount = birthdayServants.filter((s) => {
    const today = new Date();
    return s.nextBirthdayDate.getMonth() === today.getMonth() && s.nextBirthdayDate.getFullYear() === today.getFullYear();
  }).length;

  const handleSendWhatsApp = (servant: BirthdayServant) => {
    const cleanPhone = servant.phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const message = `كل سنة وأنت طيب وبخير يا خادم المسيح ${servant.full_name} بمناسبة عيد ميلادك المبارك! 🎉🎂
بصلوات قداسة البابا تواضروس الثاني ونيافة الأنبا نوفير، بنصلي لربنا يديم خدمتك ومحبتك ويبارك حياتك في كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر ✝️✨`;

    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-amber-50 mb-2 border border-white/30">
              <PartyPopper className="w-4 h-4" />
              <span>متابعة ورعاية الخدام ومحبتهم</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">
              أعياد ميلاد الخدام القادمة 🎉
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              كشف بمواعيد أعياد ميلاد الخدام والخادمات القادمة لإرسال المعايدات والمباركة لهم في أيامهم الخاصة.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث القائمة</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
          <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            أعياد ميلاد اليوم 🎂
          </span>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {todayBirthdaysCount}
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
          <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            خلال هذا الأسبوع 📅
          </span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {weekBirthdaysCount}
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
          <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            خلال هذا الشهر 🎈
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {monthBirthdaysCount}
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500" />
          <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            خدام مسجل ميلادهم 👥
          </span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {birthdayServants.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveFilter('next30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'next30'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              خلال 30 يوماً
            </button>
            <button
              onClick={() => setActiveFilter('this_week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'this_week'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setActiveFilter('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'this_month'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              كل الخدام
            </button>
          </div>

          {/* Search & Service Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">كل الخدمات</option>
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name_ar}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Birthdays Grid / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">جاري تحميل أعياد ميلاد الخدام...</div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6">
          <Cake className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            لا توجد أعياد ميلاد مطابقة في الفترة المحددة
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            تأكد من تسجيل تواريخ الميلاد في ملفات الخدام، أو قم بتوسيع نطاق البحث ليشمل "كل الخدام".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((servant) => {
            const isToday = servant.daysUntilBirthday === 0;
            const isTomorrow = servant.daysUntilBirthday === 1;

            return (
              <div
                key={servant.id}
                className={`bg-white dark:bg-stone-900 border rounded-2xl p-5 shadow-xs transition-all relative overflow-hidden hover:shadow-md ${
                  isToday
                    ? 'border-rose-400 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20'
                    : isTomorrow
                    ? 'border-amber-300 dark:border-amber-700'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Top Badge Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isToday
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isTomorrow
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : servant.daysUntilBirthday <= 7
                        ? 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <Cake className="w-3.5 h-3.5" />
                    <span>
                      {isToday
                        ? 'اليوم! عيد ميلاد سعيد 🎉'
                        : isTomorrow
                        ? 'غداً'
                        : `بعد ${servant.daysUntilBirthday} يوم`}
                    </span>
                  </span>

                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    {servant.formattedBirthday}
                  </span>
                </div>

                {/* Servant Info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400/80 bg-stone-100 dark:bg-stone-800 shrink-0 flex items-center justify-center font-bold text-amber-700 dark:text-amber-300 text-base shadow-xs">
                    {servant.profile_photo ? (
                      <img
                        src={servant.profile_photo}
                        alt={servant.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{servant.full_name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white truncate">
                      {servant.full_name}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium truncate mt-0.5">
                      {servant.service_name || 'الخدمة العامة'} • {servant.current_role || 'خادم'}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      سيكمل بإذن الرب: <strong className="text-stone-700 dark:text-stone-300 font-bold">{servant.nextAge} سنة</strong>
                    </p>
                  </div>
                </div>

                {/* Action Buttons: WhatsApp & Direct Call */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-2">
                  <button
                    onClick={() => handleSendWhatsApp(servant)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    title="إرسال تهنئة عبر واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>معايدة واتساب</span>
                  </button>

                  <a
                    href={`tel:${servant.phone}`}
                    className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                    title="اتصال هاتفي"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
