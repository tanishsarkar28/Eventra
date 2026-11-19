'use client';

/**
 * Minimalist Card Container Component
 * React Unit II: Component composition patterns (lifting state up & children prop)
 */
export default function Card({
  title,
  subtitle,
  actions,
  children,
  footer,
  className = '',
  padding = 'normal',
}) {
  return (
    <div className={`card card-padding-${padding} ${className}`}>
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
