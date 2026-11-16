'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ErrorBox } from '@/components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Start shopping in a minute</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" required minLength={2} maxLength={60} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
          </div>
          <ErrorBox message={error} />
          <button className="btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
