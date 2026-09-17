import React, { useRef } from 'react';
import { X, Printer, Download, Copy, Check, QrCode } from 'lucide-react';
import { ServantBadgeCard } from './ServantBadgeCard.js';

interface ServantIdCardModalProps {
  isOpen: boolean;
  servant: {
    id: string;
    full_name: string;
    phone: string;
    national_id?: string;
    profile_photo?: string;
    current_role?: string;
    current_service_id?: string;
    service_name?: string;
    blood_type?: string;
  } | null;
  serviceName?: string;
  onClose: () => void;
}

export const ServantIdCardModal: React.FC<ServantIdCardModalProps> = ({
  isOpen,
  servant,
  serviceName,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !servant) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(servant.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    // Print window with targeted CSS
    const cardEl = document.getElementById(`badge-preview-${servant.id}`);
    if (!cardEl) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const cardHtml = cardEl.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>كارنيه خادم - ${servant.full_name}</title>
          <style>
            @page {
              size: auto;
              margin: 15mm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
              background: #fff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .instructions {
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
              text-align: center;
            }
            .card-wrapper {
              border: 1px dashed #bbb;
              padding: 6px;
              border-radius: 28px;
              display: inline-block;
            }
          </style>
          <link rel="stylesheet" href="/src/index.css" />
        </head>
        <body>
          <div class="instructions">
            كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر - كارنيه خادم معتمد للطباعة والتغليف
          </div>
          <div class="card-wrapper">
            ${cardHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-2xl relative my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white font-serif">
                كارنيه وهوية الخادم (QR كود)
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                كارنيه مخصص لحضور اجتماع الخدام وتسجيل الحضور والانصراف
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Badge Display Area */}
        <div
          ref={cardContainerRef}
          className="flex flex-col items-center justify-center py-2 bg-stone-100/70 dark:bg-stone-950/60 rounded-2xl p-4 border border-dashed border-stone-300 dark:border-stone-800 overflow-x-auto"
        >
          <ServantBadgeCard
            id={`badge-preview-${servant.id}`}
            servant={servant}
            serviceName={serviceName}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكارنيه</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم نسخ كود الـ QR!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-500" />
                  <span>نسخ كود الخادم</span>
                </>
              )}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <span className="font-bold text-amber-700 dark:text-amber-400">ملاحظة:</span>
            <span>
              يمكن طباعة الكارنيه على ورق مقوى أو تصويره على هاتف الخادم. عند وضع الباركود أمام سكانر الكنيسة، سيتم تسجيل حضوره وانصرافه فوراً وحساب مدة حضوره للاجتماع.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
