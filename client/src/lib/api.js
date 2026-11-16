// Small fetch wrapper used everywhere in the app.
// - sends the httpOnly auth cookie automatically (same origin via Next rewrite)
// - adds the X-Requested-With header the API requires on state-changing calls
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    err.details = data && data.errors;
    throw err;
  }
  return data;
}

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export const shortDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Only allow same-site relative redirects (prevents open-redirect attacks)
export const safeNext = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';

// Shipping / tax rules mirrored from the server purely for the cart preview.
// The server recalculates everything when the order is placed.
export function calcTotals(subtotal) {
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 8;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  return { shipping, tax, total: Math.round((subtotal + shipping + tax) * 100) / 100 };
}
