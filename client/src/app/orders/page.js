'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, money, shortDate } from '@/lib/api';
import { Spinner, ErrorBox, StatusBadge } from '@/components/ui';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders/mine')
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-3xl">My orders</h1>
      <ErrorBox message={error} />
      {!orders && !error && <Spinner />}

      {orders && orders.length === 0 && (
        <div className="py-16 text-center text-slate-500">
          You haven&apos;t placed any orders yet.{' '}
          <Link href="/products" className="text-brand-600 hover:underline">
            Start shopping
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="card divide-y divide-slate-200">
          {orders.map((o) => (
            <Link key={o._id} href={`/orders/${o._id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50">
              <div>
                <p className="font-medium">Order #{o._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-slate-500">
                  {shortDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} items
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={o.status} />
                <span className="font-semibold">{money(o.totalPrice)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
