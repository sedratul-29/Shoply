'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, calcTotals, money } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ErrorBox } from '@/components/ui';

const FIELDS = [
  ['fullName', 'Full name', 'name'],
  ['phone', 'Phone', 'tel'],
  ['address', 'Street address', 'street-address'],
  ['city', 'City', 'address-level2'],
  ['postalCode', 'Postal code', 'postal-code'],
  ['country', 'Country', 'country-name'],
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, ready, subtotal, clear } = useCart();
  const { shipping, tax, total } = calcTotals(subtotal);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-4">
          Browse products
        </Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Only product ids and quantities are sent. The server looks up the real prices.
      const { order } = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.id, qty: i.qty })),
          shippingAddress: form,
          paymentMethod: 'cod',
        },
      });
      clear();
      router.push(`/orders/${order._id}`);
    } catch (err) {
      if (err.status === 401) {
        router.push('/login?next=/checkout');
        return;
      }
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl">Checkout</h1>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-2">
          <h2 className="text-lg">Shipping address</h2>
          {user && <p className="text-sm text-slate-500">Ordering as {user.email}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([key, label, autoComplete]) => (
              <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="label" htmlFor={key}>
                  {label}
                </label>
                <input
                  id={key}
                  className="input"
                  required
                  autoComplete={autoComplete}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium">Payment method</p>
            <p className="mt-1 text-slate-600">Cash on delivery. Pay when your order arrives.</p>
          </div>

          <ErrorBox message={error} />
        </div>

        <aside className="card h-fit space-y-3 p-6">
          <h2 className="text-lg">Your order</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="truncate">
                  {i.qty} × {i.name}
                </span>
                <span>{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-slate-200 pt-3 text-sm text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : money(shipping)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{money(tax)}</span></div>
            <div className="flex justify-between pt-2 text-base font-semibold text-slate-900"><span>Total</span><span>{money(total)}</span></div>
          </div>
          <button className="btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </form>
    </div>
  );
}
