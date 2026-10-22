import Link from 'next/link';

export const metadata = {
  title: 'Eventra - Campus Event Management',
  description: 'Module 1: Authentication and User Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', margin: '20px', maxWidth: '800px' }}>
        <header>
          <h1>Eventra Campus Management</h1>
          <nav>
            <Link href="/">Home</Link> |{' '}
            <Link href="/register">Register</Link> |{' '}
            <Link href="/login">Login</Link> |{' '}
            <Link href="/profile">Profile</Link> |{' '}
            <Link href="/admin">Admin</Link>
          </nav>
          <hr />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
