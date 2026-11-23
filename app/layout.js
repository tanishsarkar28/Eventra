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
    default: 'Eventra @ LPU - Lovely Professional University',
    template: '%s | Eventra LPU',
  },
  description: 'Lovely Professional University campus event management, clash avoidance, and digital pass platform.',
  keywords: ['LPU events', 'Lovely Professional University', 'campus fests', 'clash detection', 'LPU timetable'],
  authors: [{ name: 'LPU Student Eventra Team' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main>{children}</main>
            <footer className="lpu-footer">
              <div className="lpu-footer-inner">
                <div>
                  <strong>Lovely Professional University (LPU)</strong> • Jalandhar - Delhi G.T. Road, Phagwara, Punjab (144411)
                </div>
                <div style={{ marginTop: '5px', color: '#64748b', fontSize: '12px' }}>
                  Eventra Campus Events &amp; Clash Engine • Transforming Education, Transforming India
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
