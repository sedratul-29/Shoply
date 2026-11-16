'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-600">
          Shoply
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/products" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Shop
          </Link>

          {user?.role === 'admin' && (
            <Link href="/admin" className="rounded-lg px-3 py-2 font-medium text-brand-700 hover:bg-brand-50">
              Admin
            </Link>
          )}

          {user && (
            <Link href="/orders" className="hidden rounded-lg px-3 py-2 hover:bg-slate-100 sm:block">
              My orders
            </Link>
          )}

          {user && (
            <Link href="/profile" className="rounded-lg px-3 py-2 hover:bg-slate-100">
              Profile
            </Link>
          )}

          <Link href="/cart" className="relative rounded-lg px-3 py-2 hover:bg-slate-100">
            Cart
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          {!loading &&
            (user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-slate-500 md:inline">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn-outline">
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign up
                </Link>
              </div>
            ))}
        </div>
      </nav>
    </header>
  );
}
