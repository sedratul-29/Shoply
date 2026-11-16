'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { api, money, shortDate } from '@/lib/api';
import { Spinner, ErrorBox, StatusBadge, Pagination } from '@/components/ui';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (status) params.set('status', status);
    api(`/admin/orders?${params}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page, status]);

  useEffect(load, [load]);

  async function changeStatus(id, next) {
    setError('');
    try {
      await api(`/admin/orders/${id}/status`, { method: 'PUT', body: { status: next } });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Orders</h1>
        <select
          className="input w-44"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <ErrorBox message={error} />
      {!data && !error && <Spinner />}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Order</th>
                <th className="th">Customer</th>
                <th className="th">Date</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.orders.map((o) => (
                <Fragment key={o._id}>
                  <tr>
                    <td className="td font-medium">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="td">
                      {o.user ? o.user.name : 'Deleted user'}
                      <div className="text-xs text-slate-500">{o.user?.email}</div>
                    </td>
                    <td className="td">{shortDate(o.createdAt)}</td>
                    <td className="td font-medium">{money(o.totalPrice)}</td>
                    <td className="td">
                      <select
                        className="input w-36 py-1 capitalize"
                        value={o.status}
                        disabled={o.status === 'cancelled'}
                        onChange={(e) => changeStatus(o._id, e.target.value)}
                        aria-label="Order status"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="td text-right">
                      <button className="text-brand-600 hover:underline" onClick={() => setOpen(open === o._id ? null : o._id)}>
                        {open === o._id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {open === o._id && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="td">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <ul className="space-y-1">
                            {o.items.map((i) => (
                              <li key={i.product} className="flex justify-between gap-3">
                                <span>{i.qty} × {i.name}</span>
                                <span>{money(i.qty * i.price)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-slate-600">
                            <p className="font-medium text-slate-900">{o.shippingAddress.fullName}</p>
                            <p>{o.shippingAddress.address}</p>
                            <p>{o.shippingAddress.city}, {o.shippingAddress.postalCode}, {o.shippingAddress.country}</p>
                            <p>{o.shippingAddress.phone}</p>
                            <p className="mt-1"><StatusBadge status={o.status} /> {o.isPaid ? 'Paid' : 'Unpaid'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {data.orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="td py-10 text-center text-slate-500">No orders found.</td>
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
