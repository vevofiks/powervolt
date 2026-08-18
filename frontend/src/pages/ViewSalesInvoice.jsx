import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DocumentViewPage from '../components/ui/DocumentViewPage';
import InvoicePrint from '../components/sales/InvoicePrint';
import { salesInvoiceApi } from '../api/salesInvoices';
import { formatDate } from '../utils/formatDate';
import { printDocument } from '../utils/printDocument';

export default function ViewSalesInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await salesInvoiceApi.getById(id);
        setInvoice(res.data);
      } catch (err) {
        toast.error('Failed to load invoice details');
        navigate('/admin/sales-invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate]);

  const handlePrint = () => {
    printDocument();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? Stock and ledger will be reverted.')) return;
    try {
      await salesInvoiceApi.delete(id);
      toast.success('Invoice deleted');
      navigate('/admin/sales-invoice');
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  };

  if (!loading && !invoice) return null;

  return (
    <DocumentViewPage
      loading={loading}
      loadingTitle="View Invoice"
      title={`Invoice ${invoice?.invoiceNo || ''}`}
      subtitle={invoice ? `Issued on ${formatDate(invoice.date)}` : undefined}
      onBack={() => navigate('/admin/sales-invoice')}
      onPrint={handlePrint}
      printLabel="Print Invoice"
      onEdit={() => navigate(`/admin/sales-invoice/edit/${id}`)}
      editLabel="Edit Invoice"
      onDelete={handleDelete}
      deleteLabel="Delete Invoice"
    >
      {invoice && <InvoicePrint invoice={invoice} variant="sales" />}
    </DocumentViewPage>
  );
}
