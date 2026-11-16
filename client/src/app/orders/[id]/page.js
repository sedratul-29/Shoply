'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, money, shortDate } from '@/lib/api';
import { Spinner, ErrorBox, StatusBadge } from '@/components/ui';

export default function OrderDetailPage({ params }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/orders/${params.id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message));
  }, [params.id]);

  async function cancel() {
    if (!confirm('Cancel this order?')) return;
    setBusy(true);
    setError('');
    try {
      const d = await api(`/orders/${params.id}/cancel`, { method: 'PUT' });
      setOrder((o) => ({ ...o, status: d.order.status }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <ErrorBox message={error} />;
  if (!order) return <Spinner />;

  const a = order.shippingAddress;

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-slate-500">Placed on {shortDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ErrorBox message={error} />

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="card divide-y divide-slate-200 lg:col-span-2">
          {order.items.map((i) => (
            <div key={i.product} className="flex items-center gap-4 p-4">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt={i.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-slate-100" />
              )}
              <div className="flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-slate-500">
                  {i.qty} × {money(i.price)}
                </p>
              </div>
              <span className="font-semibold">{money(i.qty * i.price)}</span>
            </div>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="card space-y-2 p-6 text-sm">
            <h2 className="text-base">Summary</h2>
            <div className="flex justify-between text-slate-600"><span>Items</span><span>{money(order.itemsPrice)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'Free' : money(order.shippingPrice)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax</span><span>{money(order.taxPrice)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total</span><span>{money(order.totalPrice)}</span></div>
            <p className="pt-1 text-xs text-slate-500">
              Cash on delivery · {order.isPaid ? 'Paid' : 'Payment due on delivery'}
            </p>
          </div>

          <div className="card p-6 text-sm">
            <h2 className="mb-2 text-base">Shipping to</h2>
            <p>{a.fullName}</p>
            <p className="text-slate-600">{a.address}</p>
            <p className="text-slate-600">{a.city}, {a.postalCode}</p>
            <p className="text-slate-600">{a.country}</p>
            <p className="text-slate-600">{a.phone}</p>
          </div>

          {order.status === 'pending' && (
            <button className="btn-outline w-full" onClick={cancel} disabled={busy}>
              {busy ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
