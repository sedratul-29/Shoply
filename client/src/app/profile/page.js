'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ErrorBox, Spinner } from '@/components/ui';

function Success({ message }) {
  if (!message) return null;
  return (
    <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameOk, setNameOk] = useState('');
  const [nameBusy, setNameBusy] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <div className="py-16 text-center text-slate-500">
        Please{' '}
        <Link href="/login?next=/profile" className="text-brand-600 hover:underline">
          log in
        </Link>{' '}
        to see your profile.
      </div>
    );
  }

  async function saveName(e) {
    e.preventDefault();
    setNameError('');
    setNameOk('');
    setNameBusy(true);
    try {
      const d = await api('/auth/me', { method: 'PUT', body: { name } });
      setUser(d.user);
      setNameOk('Name updated.');
    } catch (err) {
      setNameError(err.message);
    } finally {
      setNameBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwOk('');
    if (pw.newPassword !== pw.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwBusy(true);
    try {
      await api('/auth/password', {
        method: 'PUT',
        body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword },
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwOk('Password updated. Your other devices were logged out.');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl">My profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.email} · <span className="capitalize">{user.role}</span>
        </p>
      </div>

      <form onSubmit={saveName} className="card space-y-4 p-6">
        <h2 className="text-lg">Your name</h2>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            required
            minLength={2}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <ErrorBox message={nameError} />
        <Success message={nameOk} />
        <button className="btn-primary" disabled={nameBusy}>
          {nameBusy ? 'Saving…' : 'Save name'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4 p-6">
        <h2 className="text-lg">Change password</h2>
        <div>
          <label className="label" htmlFor="current">Current password</label>
          <input
            id="current"
            type="password"
            className="input"
            required
            autoComplete="current-password"
            maxLength={72}
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="new">New password</label>
          <input
            id="new"
            type="password"
            className="input"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input
            id="confirm"
            type="password"
            className="input"
            required
            autoComplete="new-password"
            maxLength={72}
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
          />
        </div>
        <ErrorBox message={pwError} />
        <Success message={pwOk} />
        <button className="btn-primary" disabled={pwBusy}>
          {pwBusy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
