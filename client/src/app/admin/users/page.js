'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, shortDate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner, ErrorBox, Pagination } from '@/components/ui';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (q) params.set('q', q);
    api(`/admin/users?${params}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page, q]);

  useEffect(load, [load]);

  async function update(id, body) {
    setError('');
    try {
      await api(`/admin/users/${id}`, { method: 'PUT', body });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl">Users</h1>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(search.trim());
        }}
      >
        <input className="input max-w-xs" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-outline">Search</button>
      </form>

      <ErrorBox message={error} />
      {!data && !error && <Spinner />}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">User</th>
                <th className="th">Joined</th>
                <th className="th">Role</th>
                <th className="th">Status</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.users.map((u) => {
                const self = me && u._id === me._id;
                return (
                  <tr key={u._id}>
                    <td className="td">
                      <p className="font-medium">{u.name} {self && <span className="text-xs text-slate-400">(you)</span>}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="td">{shortDate(u.createdAt)}</td>
                    <td className="td">
                      <span className={`badge ${u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                    </td>
                    <td className="td">
                      <span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="td whitespace-nowrap text-right">
                      {!self && (
                        <>
                          <button
                            className="mr-3 text-brand-600 hover:underline"
                            onClick={() => {
                              const next = u.role === 'admin' ? 'user' : 'admin';
                              if (confirm(`Change ${u.name}'s role to ${next}?`)) update(u._id, { role: next });
                            }}
                          >
                            {u.role === 'admin' ? 'Make user' : 'Make admin'}
                          </button>
                          <button
                            className={u.isActive ? 'text-red-600 hover:underline' : 'text-emerald-700 hover:underline'}
                            onClick={() => update(u._id, { isActive: !u.isActive })}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}
