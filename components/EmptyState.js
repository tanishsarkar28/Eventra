'use client';

import Button from './Button';

/**
 * Minimalist Empty State Component
 * React Unit II: Reusable component abstractions
 * React Unit V: Handling empty states in client-server communication
 */
export default function EmptyState({
  icon = '📭',
  title = 'No items found',
  description = 'There are no records matching your current view.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state text-center py-10 px-4">
      <div className="empty-state-icon text-4xl mb-2.5 opacity-75">{icon}</div>
      <h4 className="empty-state-title text-base font-semibold text-slate-900 mb-1.5">{title}</h4>
      <p className="empty-state-description text-sm text-slate-500 max-w-sm mx-auto mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
