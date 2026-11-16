'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { safeNext } from '@/lib/api';
import { ErrorBox } from '@/components/ui';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to your account</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <ErrorBox message={error} />
          <button className="btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
