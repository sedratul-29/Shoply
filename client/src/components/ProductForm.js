'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ErrorBox } from '@/components/ui';

const EMPTY = {
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  stock: '',
  featured: false,
  isActive: true,
};

export default function ProductForm({ product }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          description: product.description,
          price: String(product.price),
          category: product.category,
          image: product.image || '',
          stock: String(product.stock),
          featured: product.featured,
          isActive: product.isActive,
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      if (editing) await api(`/admin/products/${product._id}`, { method: 'PUT', body });
      else await api('/admin/products', { method: 'POST', body });
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-6">
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" className="input" required maxLength={120} value={form.name} onChange={set('name')} />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" className="input min-h-28" required maxLength={2000} value={form.description} onChange={set('description')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="price">Price (USD)</label>
          <input id="price" type="number" step="0.01" min="0" className="input" required value={form.price} onChange={set('price')} />
        </div>
        <div>
          <label className="label" htmlFor="stock">Stock</label>
          <input id="stock" type="number" step="1" min="0" className="input" required value={form.stock} onChange={set('stock')} />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <input id="category" className="input" required maxLength={60} value={form.category} onChange={set('category')} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="image">Image URL</label>
        <input id="image" type="url" className="input" placeholder="https://…" maxLength={500} value={form.image} onChange={set('image')} />
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} />
          Featured on home page
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
          Visible in shop
        </label>
      </div>

      <ErrorBox message={error} />

      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
        </button>
        <button type="button" className="btn-outline" onClick={() => router.push('/admin/products')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
