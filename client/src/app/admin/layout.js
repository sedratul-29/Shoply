'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // UI guard only. Every /api/admin request is checked again by the server.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?next=/admin');
    else if (user.role !== 'admin') router.replace('/');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return <Spinner label="Checking access…" />;

  return (
    <div className="grid gap-8 md:grid-cols-[200px_1fr]">
      <aside className="card h-fit p-3">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Admin panel</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {LINKS.map((l) => {
            const active = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
