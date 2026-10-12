import { useCrmToast } from '../context/CrmToastContext';

const typeStyles = {
  success: {
    bar: 'bg-emerald-500',
    box: 'border-emerald-200 bg-emerald-50/95',
    icon: 'bg-emerald-600 text-white',
    glyph: '✓',
    title: 'text-emerald-900',
    text: 'text-emerald-800',
  },
  error: {
    bar: 'bg-red-500',
    box: 'border-red-200 bg-red-50/95',
    icon: 'bg-red-600 text-white',
    glyph: '!',
    title: 'text-red-900',
    text: 'text-red-800',
  },
  warning: {
    bar: 'bg-amber-500',
    box: 'border-amber-200 bg-amber-50/95',
    icon: 'bg-amber-500 text-white',
    glyph: '⚠',
    title: 'text-amber-900',
    text: 'text-amber-800',
  },
  info: {
    bar: 'bg-purple-500',
    box: 'border-purple-200 bg-white/95',
    icon: 'bg-purple-600 text-white',
    glyph: 'i',
    title: 'text-slate-900',
    text: 'text-slate-700',
  },
};

export function CrmToaster() {
  const { toasts, dismiss } = useCrmToast();

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
      style={{ width: '18vw', minWidth: 250, maxWidth: 320 }}
    >
      <div className="flex flex-col gap-2 w-full max-h-[70vh] overflow-y-auto overflow-x-hidden crm-toaster-scroll pointer-events-auto">
        {toasts.map((t) => {
          const s = typeStyles[t.type] || typeStyles.info;
          return (
            <div
              key={t.id}
              className={`crm-toast-in w-full flex items-stretch border shadow-lg backdrop-blur-sm overflow-hidden ${s.box}`}
            >
              <div className={`w-1 flex-shrink-0 ${s.bar}`} />
              <div className={`flex-shrink-0 m-2 size-6 flex items-center justify-center text-xs font-black ${s.icon}`}>
                {s.glyph}
              </div>
              <div className="flex-1 min-w-0 py-2 pr-1">
                {t.title && (
                  <div className={`text-[11px] font-bold uppercase tracking-wider truncate ${s.title}`}>
                    {t.title}
                  </div>
                )}
                <div
                  className={`text-xs leading-snug break-words overflow-hidden ${s.text}`}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                  title={t.message}
                >
                  {t.message}
                </div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 px-1.5 text-slate-400 hover:text-slate-700 text-sm leading-none cursor-pointer"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CrmToaster;
