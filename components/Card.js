'use client';

import { memo } from 'react';

/**
 * Minimalist Card Container Component
 * React Unit II: Component composition patterns (lifting state up & children prop)
 * React Unit III: Performance optimization using React.memo
 */
function Card({
  title,
  subtitle,
  actions,
  children,
  footer,
  className = '',
  padding = 'normal',
}) {
  return (
    <div className={`card card-padding-${padding} bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {(title || subtitle || actions) && (
        <div className="card-header flex items-center justify-between border-b border-slate-200">
          <div>
            {title && <h3 className="card-title text-slate-900 font-semibold">{title}</h3>}
            {subtitle && <p className="card-subtitle text-slate-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer bg-slate-50 border-t border-slate-200">{footer}</div>}
    </div>
  );
}

export default memo(Card);
