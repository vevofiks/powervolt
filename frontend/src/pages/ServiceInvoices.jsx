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
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi';

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

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', render: (val) => <span className="font-semibold text-primary">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'customerName', label: 'Customer', render: (val) => val || '—' },
    { key: 'totalAmount', label: 'Total Amount', align: 'right', render: (val) => <span className="font-semibold">{formatCurrency(val)}</span> },
    { key: 'id', label: 'Actions', align: 'right', render: (id) => (
      <button className="text-gray-500 hover:text-primary transition-colors p-1" onClick={() => navigate(`/admin/service-invoice/${id}`)} title="View">
        <HiOutlineEye size={18} />
      </button>
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
