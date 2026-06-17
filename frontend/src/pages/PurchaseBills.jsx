import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { purchaseBillApi } from '../api/purchaseBills';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlineEye, HiOutlineSearch, HiOutlineTrash } from 'react-icons/hi';

export default function PurchaseBills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseBillApi.getAll({ search: searchQuery });
      setBills(res.data || []);
    } catch (err) {
      toast.error('Failed to load purchase bills');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase bill? This will revert product stock levels and account balances associated with this bill.')) return;
    try {
      await purchaseBillApi.delete(id);
      toast.success('Purchase bill deleted successfully');
      setBills(prev => prev.filter(bill => bill.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete purchase bill');
    }
  };

  const handlePaymentStatusChange = async (id, newStatus) => {
    try {
      await purchaseBillApi.updatePaymentStatus(id, newStatus);
      toast.success('Payment status updated');
      setBills(prev => prev.map(bill => bill.id === id ? { ...bill, paymentStatus: newStatus } : bill));
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const columns = [
    { key: 'billNo', label: 'Bill No', render: (val) => <span className="font-semibold text-primary">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'vendorName', label: 'Vendor', render: (val) => val || '—' },
    { key: 'billType', label: 'Type', render: (val) => (
      <Badge variant={val === 'GST' ? 'success' : 'default'}>{val}</Badge>
    )},
    { key: 'totalAmount', label: 'Total Amount', align: 'right', render: (val) => (
      <span className="font-semibold">{formatCurrency(val)}</span>
    )},
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
      <div className="flex gap-2 justify-end" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button 
          className="text-gray-500 hover:text-primary transition-colors p-1" 
          onClick={() => navigate(`/admin/purchase-bills/${id}`)} 
          title="View Bill"
        >
          <HiOutlineEye size={18} />
        </button>
        <button 
          className="text-red-500 hover:text-red-700 transition-colors p-1" 
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(id);
          }} 
          title="Delete Bill"
        >
          <HiOutlineTrash size={18} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper">
      <PageHeader 
        title="Purchase Bills" 
        subtitle="Manage your vendor purchases and inventory inflow"
        actionLabel="Create Bill"
        actionIcon={HiOutlinePlus}
        onAction={() => navigate('/admin/purchase-bills/create')}
      />

      <div className="toolbar mb-4">
        <div className="search-box">
          <HiOutlineSearch className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by Bill No or Vendor Name..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div style={{ padding: 24 }}><LoadingSkeleton height="40px" count={6} /></div>
        ) : (
          <DataTable 
            columns={columns} 
            data={bills} 
            emptyMessage="No purchase bills found. Create your first bill!" 
          />
        )}
      </Card>
    </div>
  );
}
