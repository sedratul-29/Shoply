'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Spinner, ErrorBox, Pagination } from '@/components/ui';

export default function ProductsPage() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api('/products/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setError('');
    const params = new URLSearchParams({ page, limit: 12, sort });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    api(`/products?${params}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [q, category, sort, page]);

  function submitSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(search.trim());
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl">Shop</h1>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <form onSubmit={submitSearch} className="flex flex-1 gap-2">
          <input
            className="input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={80}
          />
          <button className="btn-primary">Search</button>
        </form>

        <select
          className="input md:w-48"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input md:w-48"
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>

      <ErrorBox message={error} />
      {!data && !error && <Spinner />}

      {data && data.products.length === 0 && (
        <p className="py-16 text-center text-slate-500">No products match your search.</p>
      )}

      {data && data.products.length > 0 && (
        <>
          <p className="mb-4 text-sm text-slate-500">{data.total} products</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
