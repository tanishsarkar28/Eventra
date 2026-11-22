'use client';

import { memo } from 'react';

/**
 * Minimalist Status Badge Component
 * React Unit II: Props-driven component reusability & conditional rendering
 * React Unit III: Performance optimization using React.memo (skips re-render if props are identical)
 */
function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) {
  let resolvedVariant = variant;
  if (typeof children === 'string') {
    const text = children.toLowerCase();
    if (text.includes('published') || text.includes('active') || text.includes('confirmed') || text.includes('approved') || text.includes('verified') || text.includes('success')) {
      resolvedVariant = 'success';
    } else if (text.includes('draft') || text.includes('pending') || text.includes('waitlist') || text.includes('warning')) {
      resolvedVariant = 'warning';
    } else if (text.includes('cancel') || text.includes('reject') || text.includes('critical') || text.includes('error') || text.includes('danger')) {
      resolvedVariant = 'danger';
    } else if (text.includes('info') || text.includes('technical') || text.includes('cultural')) {
      resolvedVariant = 'info';
    }
  }

  return (
    <span className={`badge badge-${resolvedVariant} badge-${size} ${className}`}>
      {dot && <span className={`badge-dot badge-dot-${resolvedVariant}`} />}
      {children}
    </span>
  );
}

export default memo(Badge);
