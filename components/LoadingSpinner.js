'use client';

/**
 * Minimalist Loading Spinner Component
 * React Unit II: Functional component abstraction
 * React Unit V: Handling loading states cleanly
 */
export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeMap = {
    sm: { width: '16px', height: '16px', border: '2px' },
    md: { width: '24px', height: '24px', border: '2.5px' },
    lg: { width: '36px', height: '36px', border: '3px' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <div
        className="spinner"
        style={{
          width: currentSize.width,
          height: currentSize.height,
          borderWidth: currentSize.border,
        }}
      />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
}
