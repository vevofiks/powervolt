import Button from './Button';
import './PageHeader.css';

export default function PageHeader({ title, subtitle, actionLabel, actionIcon, onAction, children }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      <div className="page-header__actions">
        {children}
        {actionLabel && (
          <Button icon={actionIcon} onClick={onAction} id={`btn-add-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
