import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import './TableActions.css';

export default function TableActions({ onView, onEdit, onDelete, children }) {
  return (
    <div className="table-actions">
      {onView && (
        <button type="button" className="table-actions__btn" onClick={onView} title="View">
          <HiOutlineEye size={18} />
        </button>
      )}
      {onEdit && (
        <button type="button" className="table-actions__btn" onClick={onEdit} title="Edit">
          <HiOutlinePencil size={18} />
        </button>
      )}
      {children}
      {onDelete && (
        <button
          type="button"
          className="table-actions__btn table-actions__btn--danger"
          onClick={onDelete}
          title="Delete"
        >
          <HiOutlineTrash size={18} />
        </button>
      )}
    </div>
  );
}
