'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, money } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { Spinner, ErrorBox } from '@/components/ui';

export default function ProductDetailPage({ params }) {
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api(`/products/${params.id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} />
        <Link href="/products" className="text-brand-600 hover:underline">
          ← Back to shop
        </Link>
      </div>
    );
  }
  if (!product) return <Spinner />;

  const out = product.stock <= 0;
  const maxQty = Math.min(product.stock, 20);

  function handleAdd() {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      <Link href="/products" className="mb-6 inline-block text-sm text-brand-600 hover:underline">
        ← Back to shop
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="card overflow-hidden">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-slate-400">No image</div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
          <h1 className="mt-1 text-3xl">{product.name}</h1>
          <p className="mt-4 text-3xl font-semibold text-brand-700">{money(product.price)}</p>

          <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-600">{product.description}</p>

          <p className={`mt-6 text-sm font-medium ${out ? 'text-red-600' : product.stock <= 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {out ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In stock'}
          </p>

          {!out && (
            <div className="mt-6 flex items-center gap-3">
              <select className="input w-24" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button className="btn-primary px-8 py-2.5" onClick={handleAdd}>
                {added ? 'Added ✓' : 'Add to cart'}
              </button>
              <Link href="/cart" className="btn-outline">
                View cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
