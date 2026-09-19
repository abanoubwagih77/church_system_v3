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
    const cardEl = document.getElementById(`badge-preview-${servant.id}`);
    if (!cardEl) {
      window.print();
      return;
    }

    // Collect all stylesheets and style tags from current document
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const cardHtml = cardEl.outerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>كارنيه خادم - ${servant.full_name}</title>
          ${headStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              font-family: 'Noto Sans Arabic', system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
              background: #ffffff !important;
            }
            .instructions {
              font-size: 13px;
              font-weight: bold;
              color: #78350f;
              margin-bottom: 18px;
              text-align: center;
              padding: 8px 16px;
              background: #fef3c7;
              border-radius: 8px;
              border: 1px solid #fde68a;
            }
            .card-wrapper {
              display: inline-block;
              padding: 8px;
              border: 2px dashed #d97706;
              border-radius: 32px;
              background: #fff;
              page-break-inside: avoid;
            }
            /* Explicit fallback styling to ensure card renders even if external CSS is stripped */
            .servant-id-card {
              width: 320px !important;
              min-height: 480px !important;
              border-radius: 24px !important;
              overflow: hidden !important;
              background: #1c1917 !important;
              color: #ffffff !important;
              border: 2px solid #f59e0b !important;
              display: flex !important;
              flex-direction: column !important;
              position: relative !important;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 10mm 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="instructions no-print">
            ✝️ كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر — كارنيه خادم معتمد (جاهز للطباعة والقص والتغليف)
          </div>
          <div class="card-wrapper">
            ${cardHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
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
