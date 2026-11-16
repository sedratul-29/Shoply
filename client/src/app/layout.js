import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Shoply - Online Store',
  description: 'A full-stack e-commerce store built with Next.js, Express and MongoDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Shoply. All rights reserved.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
