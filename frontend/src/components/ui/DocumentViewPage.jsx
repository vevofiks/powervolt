import PageHeader from './PageHeader';
import Card from './Card';
import LoadingSkeleton from './LoadingSkeleton';
import Button from './Button';
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';

export default function DocumentViewPage({
  loading,
  loadingTitle = 'Loading...',
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  onPrint,
  printLabel = 'Print',
  onEdit,
  editLabel = 'Edit',
  onDelete,
  deleteLabel = 'Delete',
  extraActions,
  children,
}) {
  if (loading) {
    return (
      <div className="page-wrapper">
        <PageHeader title={loadingTitle} />
        <Card><LoadingSkeleton height="400px" /></Card>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="no-print">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actionLabel={backLabel}
          actionIcon={HiOutlineArrowLeft}
          onAction={onBack}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onPrint && (
              <Button icon={HiOutlinePrinter} onClick={onPrint}>{printLabel}</Button>
            )}
            {onEdit && (
              <Button variant="secondary" icon={HiOutlinePencil} onClick={onEdit}>{editLabel}</Button>
            )}
            {onDelete && (
              <Button variant="danger" icon={HiOutlineTrash} onClick={onDelete}>{deleteLabel}</Button>
            )}
            {extraActions}
          </div>
        </PageHeader>
      </div>
      {children}
    </div>
  );
}
