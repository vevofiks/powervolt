import { HiOutlineInbox } from 'react-icons/hi';
import './EmptyState.css';

export default function EmptyState({ title = 'No data yet', description = '', icon: Icon = HiOutlineInbox }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
    </div>
  );
}
