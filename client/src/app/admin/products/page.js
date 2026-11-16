'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, money } from '@/lib/api';
import { Spinner, ErrorBox, Pagination } from '@/components/ui';

export default function AdminProducts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (q) params.set('q', q);
    api(`/admin/products?${params}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page, q]);

  useEffect(load, [load]);

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/products/${p._id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          + New product
        </Link>
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(search.trim());
        }}
      >
        <input className="input max-w-xs" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-outline">Search</button>
      </form>

      <ErrorBox message={error} />
      {!data && !error && <Spinner />}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Product</th>
                <th className="th">Category</th>
                <th className="th">Price</th>
                <th className="th">Stock</th>
                <th className="th">Status</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.products.map((p) => (
                <tr key={p._id}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100" />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="td">{p.category}</td>
                  <td className="td">{money(p.price)}</td>
                  <td className={`td font-medium ${p.stock <= 5 ? 'text-amber-700' : ''}`}>{p.stock}</td>
                  <td className="td">
                    <span className={`badge ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {p.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="td whitespace-nowrap text-right">
                    <Link href={`/admin/products/${p._id}`} className="mr-3 text-brand-600 hover:underline">Edit</Link>
                    <button onClick={() => remove(p)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {data.products.length === 0 && (
                <tr>
                  <td colSpan={6} className="td py-10 text-center text-slate-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}
