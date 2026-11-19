import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Next.js App Router Loading UI (Unit I: Error and Loading UI)
 * Automatically displayed by Next.js during route transitions.
 */
export default function Loading() {
  return (
    <div className="page-loading-wrapper">
      <LoadingSpinner size="lg" text="Loading Eventra..." />
    </div>
  );
}
