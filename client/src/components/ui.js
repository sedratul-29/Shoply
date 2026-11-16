'use client';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-sky-100 text-sky-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ status }) {
  return <span className={`badge capitalize ${STATUS_STYLES[status] || ''}`}>{status}</span>;
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button className="btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {page} of {pages}
      </span>
      <button className="btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
