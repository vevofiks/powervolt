import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { serviceInvoiceApi } from '../api/serviceInvoices';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi';

export default function ServiceInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await serviceInvoiceApi.getAll();
      setInvoices(res.data || []);
    } catch (err) {
      toast.error('Failed to load service invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePaymentStatusChange = async (id, newStatus) => {
    try {
      await serviceInvoiceApi.updatePaymentStatus(id, newStatus);
      toast.success('Payment status updated');
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paymentStatus: newStatus } : inv));
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service invoice? Ledger transaction will be reverted.')) return;
    try {
      await serviceInvoiceApi.delete(id);
      toast.success('Service Invoice deleted');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to delete service invoice');
    }
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', render: (val) => <span className="font-semibold text-primary">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'customerName', label: 'Customer', render: (val) => val || '—' },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', render: (val) => <span className="font-semibold">{formatCurrency(val)}</span> },
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
    { key: 'id', label: 'Actions', align: 'right', render: (id) => (
      <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
        <button className="text-gray-500 hover:text-primary transition-colors p-1" onClick={() => navigate(`/admin/service-invoice/${id}`)} title="View">
          <HiOutlineEye size={18} />
        </button>
        <button className="text-gray-500 hover:text-red-500 transition-colors p-1" onClick={() => handleDelete(id)} title="Delete">
          <HiOutlineTrash size={18} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper">
      <PageHeader 
        title="Service Invoices" 
        subtitle="Manage billing for services and labor"
        actionLabel="Create Service Invoice"
        actionIcon={HiOutlinePlus}
        onAction={() => navigate('/admin/service-invoice/create')}
      />

      <Card padding={false}>
        {loading ? (
          <div style={{ padding: 24 }}><LoadingSkeleton height="40px" count={6} /></div>
        ) : (
          <DataTable columns={columns} data={invoices} emptyMessage="No service invoices found." />
        )}
      </Card>
    </div>
  );
}
