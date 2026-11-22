import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

/**
 * Root Layout (Next.js Unit I: Project Structure & Layouts)
 * Metadata API (Next.js Unit V: Performance & SEO)
 * Global State Context Provider (React Unit VI: Global State Management)
 */
export const metadata = {
  title: {
    default: 'Eventra - Campus Event Management',
    template: '%s | Eventra',
  },
  description: 'Lightweight, modern campus event management and scheduling platform.',
  keywords: ['campus events', 'event management', 'college timetable', 'clash detection'],
  authors: [{ name: 'Eventra Engineering Team' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
