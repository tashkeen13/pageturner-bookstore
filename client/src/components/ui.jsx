import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Star } from 'lucide-react';

export function Button({ variant = 'primary', size = 'md', className = '', as: Element = 'button', ...props }) {
  return <Element className={`ui-button ui-button-${variant} ui-button-${size} ${className}`.trim()} {...props} />;
}

export function Input({ label, hint, error, id, className = '', ...props }) {
  const fieldId = id || props.name;
  return <label className={`ui-field ${className}`.trim()} htmlFor={fieldId}>{label && <span>{label}</span>}<input id={fieldId} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined} {...props} />{hint && <small id={`${fieldId}-hint`}>{hint}</small>}{error && <small className="ui-field-error" id={`${fieldId}-error`}>{error}</small>}</label>;
}

export function Select({ label, id, className = '', children, ...props }) {
  const fieldId = id || props.name;
  return <label className={`ui-field ${className}`.trim()} htmlFor={fieldId}>{label && <span>{label}</span>}<select id={fieldId} {...props}>{children}</select></label>;
}

export function PasswordField({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false);
  return <label className="password-field">{label}<span className="password-input"><input {...props} type={visible ? 'text' : 'password'} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>;
}

export function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return <span className={`ui-badge ui-badge-${tone} ${className}`.trim()} {...props}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, children, action, className = '' }) {
  return <div className={`ui-empty-state ${className}`.trim()}>{Icon && <span className="ui-empty-icon"><Icon size={24} /></span>}<h2>{title}</h2>{children && <p>{children}</p>}{action}</div>;
}

export function Skeleton({ className = '', ...props }) {
  return <span className={`ui-skeleton ${className}`.trim()} aria-hidden="true" {...props} />;
}

export function Modal({ title, onClose, children, actions, className = '' }) {
  return <div className="ui-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}><section className={`ui-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="ui-modal-close" type="button" aria-label="Close dialog" onClick={onClose}>×</button></header><div className="ui-modal-body">{children}</div>{actions && <footer>{actions}</footer>}</section></div>;
}

export function Breadcrumbs({ items = [] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>{index < items.length - 1 && item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>)}</ol></nav>;
}

export function RatingStars({ value = 0, count, className = '' }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return <span className={`rating-stars ${className}`.trim()} aria-label={`${rating.toFixed(1)} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < Math.round(rating) ? 'currentColor' : 'none'} />)}<b>{rating.toFixed(1)}</b>{count !== undefined && <small>({count})</small>}</span>;
}

export function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null;
  return <nav className={`ui-pagination ${className}`.trim()} aria-label="Pagination"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button><span>Page <strong>{page}</strong> of {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</Button></nav>;
}

export function CheckoutSteps({ current = 0 }) {
  const steps = ['Shipping', 'Payment', 'Review'];
  return <ol className="checkout-steps">{steps.map((step, index) => <li key={step} className={index <= current ? 'is-current' : ''}><span>{index + 1}</span>{step}</li>)}</ol>;
}
