'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, money, shortDate } from '@/lib/api';
import { Spinner, ErrorBox, StatusBadge } from '@/components/ui';

function Stat({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats')
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!stats) return <Spinner />;

  const maxRevenue = Math.max(1, ...stats.daily.map((d) => d.revenue));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={money(stats.revenue)} />
        <Stat label="Orders" value={stats.counts.orders} />
        <Stat label="Products" value={stats.counts.products} />
        <Stat label="Customers" value={stats.counts.users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-base">Revenue, last 7 days</h2>
          {stats.daily.length === 0 ? (
            <p className="text-sm text-slate-500">No orders in the last 7 days.</p>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {stats.daily.map((d) => (
                <div key={d._id} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{money(d.revenue)}</span>
                  <div
                    className="w-full rounded-t bg-brand-500"
                    style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}px` }}
                    title={`${d.orders} orders`}
                  />
                  <span className="text-[10px] text-slate-500">{d._id.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-base">Orders by status</h2>
          <ul className="space-y-2 text-sm">
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
              <li key={s} className="flex items-center justify-between">
                <StatusBadge status={s} />
                <span className="font-medium">{stats.ordersByStatus[s] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {stats.recentOrders.map((o) => (
                <li key={o._id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{o.user ? o.user.name : 'Deleted user'}</p>
                    <p className="text-xs text-slate-500">{shortDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-medium">{money(o.totalPrice)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-base">Low stock</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {stats.lowStock.map((p) => (
                <li key={p._id} className="flex justify-between py-2">
                  <Link href={`/admin/products/${p._id}`} className="hover:text-brand-600">{p.name}</Link>
                  <span className={p.stock === 0 ? 'font-semibold text-red-600' : 'font-semibold text-amber-700'}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
