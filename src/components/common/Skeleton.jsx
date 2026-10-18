/**
 * Reusable Skeleton loader components for Invio CRM.
 * Provides shimmering/pulsing placeholder states matching the Invio design system.
 */

export function Skeleton({ className = '', variant = 'rect', ...props }) {
  const baseClasses = 'animate-pulse bg-slate-200/80';
  let variantClasses = 'rounded';
  if (variant === 'circle') variantClasses = 'rounded-full';
  else if (variant === 'pill') variantClasses = 'rounded-full';
  else if (variant === 'text') variantClasses = 'rounded h-3.5';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function PricingCardSkeleton({ isFeatured = false }) {
  return (
    <div
      className={`p-6 rounded-2xl border bg-white flex flex-col justify-between shadow-xs relative ${
        isFeatured ? 'border-purple-300 ring-2 ring-purple-600/10' : 'border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-3 w-28 rounded mt-1.5" />
        </div>

        <div className="space-y-2 mb-6">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>

        <div className="w-full border-t border-slate-100 mb-6" />

        <ul className="space-y-3 mb-8">
          {[88, 72, 94, 65, 80, 75].map((width, idx) => (
            <li key={idx} className="flex items-center gap-2.5">
              <Skeleton className="size-4 rounded-full shrink-0" />
              <Skeleton className="h-3.5 rounded" style={{ width: `${width}%` }} />
            </li>
          ))}
        </ul>
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="py-2.5 px-3">
              <Skeleton
                className="h-3.5 rounded"
                style={{
                  width: `${Math.max(40, ((rIdx * 19 + cIdx * 37) % 55) + 40)}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white p-3 border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="size-5 rounded" />
      </div>
      <Skeleton className="h-6 w-16 rounded" />
      <Skeleton className="h-2.5 w-24 rounded" />
    </div>
  );
}
