import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import TableActions from '../components/ui/TableActions';
import { salesInvoiceApi } from '../api/salesInvoices';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineChat } from 'react-icons/hi';
import './SalesInvoice.css';

export default function SalesInvoice() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, hasNext: false, hasPrev: false });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (searchQuery) params.search = searchQuery;
      const res = await salesInvoiceApi.getAll(params);
      setInvoices(res.data?.items || []);
      setPagination(res.data?.pagination || { totalPages: 1, hasNext: false, hasPrev: false });
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice? Stock and ledger will be reverted.')) return;
    try {
      await salesInvoiceApi.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  };

  const handlePaymentStatusChange = async (id, newStatus) => {
    try {
      await salesInvoiceApi.updatePaymentStatus(id, newStatus);
      toast.success('Payment status updated');
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paymentStatus: newStatus } : inv));
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleWhatsApp = (invoice) => {
    const phone = invoice.customerPhone || '';
    if (!phone) return toast.error('No customer phone number available');
    const message = `Hi ${invoice.customerName || 'Customer'}, here is your invoice ${invoice.invoiceNo} from Power Volt. Total Amount: ₹${invoice.totalAmount}. Thank you for your business!`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'customerName', label: 'Customer', render: (val, row) => val || row.customerPhone || 'Walk-in' },
    { key: 'totalAmount', label: 'Total', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'paymentStatus', label: 'Payment', render: (val, row) => (
      <select 
        value={val || 'PENDING'} 
        onChange={(e) => handlePaymentStatusChange(row.id, e.target.value)}
        className={`px-2 py-1 text-sm border rounded ${val === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
      </select>
    )},
    { key: 'id', label: 'Actions', align: 'right', render: (_, row) => (
      <TableActions
        onView={() => navigate(`/admin/sales-invoice/${row.id}`)}
        onEdit={() => navigate(`/admin/sales-invoice/edit/${row.id}`)}
        onDelete={() => handleDelete(row.id)}
      >
        <button
          type="button"
          className="table-actions__btn"
          title="WhatsApp Share"
          onClick={() => handleWhatsApp(row)}
        >
          <HiOutlineChat size={18} />
        </button>
      </TableActions>
    )},
  ];

  return (
    <div className="page-wrapper sales-invoice-page">
      <PageHeader 
        title="Sales Invoices" 
        subtitle="Manage your sales history and billing"
        actionLabel="Create Invoice"
        actionIcon={HiOutlinePlus}
        onAction={() => navigate('/admin/sales-invoice/create')}
      />

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by invoice no or customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card padding={false}>
        <DataTable 
          columns={columns} 
          data={invoices} 
          loading={loading}
          emptyMessage="No invoices found. Start by creating one!"
        />
        {pagination.totalPages > 1 && (
          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
