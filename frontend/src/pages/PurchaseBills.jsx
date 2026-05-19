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
import { HiOutlinePlus, HiOutlineEye, HiOutlineSearch } from 'react-icons/hi';

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
    { key: 'id', label: 'Actions', align: 'right', render: (id) => (
      <button 
        className="text-gray-500 hover:text-primary transition-colors p-1" 
        onClick={() => navigate(`/admin/purchase-bills/${id}`)} 
        title="View Bill"
      >
        <HiOutlineEye size={18} />
      </button>
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
