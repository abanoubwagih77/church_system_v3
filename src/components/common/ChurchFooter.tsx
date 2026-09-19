import React from 'react';
import { Cross } from 'lucide-react';

export const ChurchFooter: React.FC = () => {
  return (
    <footer className="mt-6 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 py-2.5 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
        {/* Church Identity + Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/80 shadow-xs shrink-0 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <img
              src="/church-logo.png"
              alt="كنيسة الشهيد العظيم مارجرجس"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/st-george.jpg';
              }}
            />
          </div>
          <div>
            <div className="font-bold text-stone-900 dark:text-white font-serif text-xs leading-tight">
              كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
              إيبارشية شبين القناطر وتوابعها
            </div>
          </div>
        </div>

        {/* Biblical Verse */}
        <div className="hidden lg:block text-center text-[11px] font-serif italic text-amber-700 dark:text-amber-400">
          "كُونُوا أَمَنَاءَ إِلَى الْمَوْتِ فَسَأُعْطِيكَ إِكْلِيلَ الْحَيَاةِ" (رؤ 2: 10)
        </div>

        {/* Social Icons Only + Developer Credits */}
        <div className="flex items-center gap-4">
          {/* Social Media - Icons Only */}
          <div className="flex items-center gap-1.5">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1QQGYw1RHz/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              title="صفحة الكنيسة على Facebook"
              className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-800/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/st.george.church.shibin?stkn=MTZ3N3Rwb3dlZmo4aw=="
              target="_blank"
              rel="noopener noreferrer"
              title="حساب الكنيسة على Instagram"
              className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-600 hover:text-white dark:hover:bg-pink-600 dark:hover:text-white border border-pink-200 dark:border-pink-800/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com/@st.george.church?si=zJ12XkbgJxwG9P1n"
              target="_blank"
              rel="noopener noreferrer"
              title="قناة الكنيسة على YouTube"
              className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          {/* Credits */}
          <div className="text-[10px] text-stone-500 dark:text-stone-400 whitespace-nowrap">
            <span>تطوير: </span>
            <strong className="text-amber-700 dark:text-amber-400 font-bold">
              م/ أبانوب وجيه
            </strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
