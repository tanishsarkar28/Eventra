import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Eventra - Campus Event Management',
  description: 'Eventra Campus Event Management - Module 1 & Module 2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header>
            <h1>Eventra Campus Management</h1>
            <nav>
              <Link href="/">Home</Link>
              <Link href="/register">Register</Link>
              <Link href="/login">Login</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/my-events">My Events</Link>
              <Link href="/venues">Venues</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
