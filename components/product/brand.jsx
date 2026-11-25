import Link from 'next/link';
export function Brand({ href = '/', inverse = false }) {
  return <Link href={href} className={`cd-brand ${inverse ? 'cd-brand-inverse' : ''}`} aria-label="CloudDeck home"><span className="cd-mark" aria-hidden="true"><i/><i/><i/></span>CloudDeck<span className="cd-wordmark-dot">.</span></Link>;
}
export function Status({ value = 'unknown' }) {
  const status = String(value).toLowerCase();
  return <span className={`cd-status cd-status-${status}`}><span/>{status.replaceAll('-', ' ')}</span>;
}
export function PageHeader({ eyebrow, title, description, children }) {
  return <header className="cd-page-heading"><div><p className="cd-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="cd-subtitle">{description}</p>}</div><div className="cd-heading-actions">{children}</div></header>;
}
export function ErrorNotice({ error, retry }) {
  if (!error) return null;
  return <div className="cd-error" role="alert"><div><strong>Couldn’t load the latest data.</strong><p>{error.message || 'Please try again.'} Previously loaded data may be out of date.</p></div>{retry && <button className="cd-button cd-button-secondary" onClick={retry}>Try again</button>}</div>;
}
