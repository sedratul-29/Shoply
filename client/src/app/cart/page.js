'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { calcTotals, money } from '@/lib/api';

export default function CartPage() {
  const { items, ready, setQty, remove, subtotal } = useCart();
  const { shipping, tax, total } = calcTotals(subtotal);

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl">Shopping cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="card divide-y divide-slate-200 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-slate-100" />
              )}

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <Link href={`/products/${item.id}`} className="font-medium hover:text-brand-600">
                    {item.name}
                  </Link>
                  <span className="font-semibold">{money(item.price * item.qty)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="btn-outline h-8 w-8 p-0" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease">
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button className="btn-outline h-8 w-8 p-0" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase">
                      +
                    </button>
                  </div>
                  <button className="text-sm text-red-600 hover:underline" onClick={() => remove(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card h-fit space-y-3 p-6">
          <h2 className="text-lg">Order summary</h2>
          <Row label="Subtotal" value={money(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? 'Free' : money(shipping)} />
          <Row label="Tax (5%)" value={money(tax)} />
          <div className="border-t border-slate-200 pt-3">
            <Row label="Total" value={money(total)} bold />
          </div>
          {subtotal < 100 && (
            <p className="text-xs text-slate-500">Add {money(100 - subtotal)} more for free shipping.</p>
          )}
          <Link href="/checkout" className="btn-primary w-full py-2.5">
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'text-base font-semibold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
