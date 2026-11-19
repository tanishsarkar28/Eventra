import Link from 'next/link';

/**
 * Next.js App Router 404 Not Found UI (Unit I: Routing and Navigation)
 * Rendered when notFound() is triggered or a route does not exist.
 */
export default function NotFound() {
  return (
    <div className="not-found-card">
      <div className="not-found-code">404</div>
      <h2 className="not-found-title">Page Not Found</h2>
      <p className="not-found-description">
        The page or campus event you are looking for does not exist or may have been moved.
      </p>
      <div className="not-found-actions">
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
        <Link href="/discover" className="btn btn-outline">
          Discover Events
        </Link>
      </div>
    </div>
  );
}
