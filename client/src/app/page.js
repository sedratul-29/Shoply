'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Spinner, ErrorBox } from '@/components/ui';

export default function HomePage() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/products?featured=true&limit=8')
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-800 px-8 py-16 text-white sm:px-14">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-indigo-200">New season</p>
        <h1 className="max-w-xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          Everything you need, delivered to your door.
        </h1>
        <p className="mt-4 max-w-lg text-indigo-100">
          Free shipping on orders over $100. Browse clothing, electronics, home and sports essentials.
        </p>
        <Link href="/products" className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-indigo-50">
          Shop now
        </Link>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl">Featured products</h2>
          <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
            View all →
          </Link>
        </div>

        <ErrorBox message={error} />
        {!products && !error && <Spinner />}
        {products && products.length === 0 && (
          <p className="text-slate-500">No featured products yet. Run the seed script or add some from the admin panel.</p>
        )}
        {products && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
