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
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
