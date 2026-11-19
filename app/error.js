'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';

/**
 * Next.js App Router Error UI (Unit I: Error and Loading UI)
 * Catches unhandled runtime exceptions in nested segments and provides recovery.
 */
export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to console or error reporting service (Unit V: Error Logging)
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="error-boundary-card">
      <div className="error-icon">⚠️</div>
      <h2 className="error-title">Something went wrong</h2>
      <p className="error-message">
        {error?.message || 'An unexpected error occurred while rendering this view.'}
      </p>
      <div className="error-actions">
        <Button variant="primary" onClick={() => reset()}>
          Try Again
        </Button>
        <Link href="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
