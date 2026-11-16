'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { money } from '@/lib/api';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const out = product.stock <= 0;

  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={`/products/${product._id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
        )}
        {out && (
          <span className="badge absolute left-3 top-3 bg-slate-900 text-white">Sold out</span>
        )}
        {!out && product.stock <= 5 && (
          <span className="badge absolute left-3 top-3 bg-amber-100 text-amber-800">
            Only {product.stock} left
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
        <Link href={`/products/${product._id}`} className="line-clamp-2 font-medium text-slate-900 hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold">{money(product.price)}</span>
          <button className="btn-primary px-3 py-1.5" disabled={out} onClick={() => add(product, 1)}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
