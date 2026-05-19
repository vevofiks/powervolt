import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { vendorApi } from '../api/vendors';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlineArrowLeft, HiOutlineOfficeBuilding, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker, HiOutlineEye } from 'react-icons/hi';

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVendor = useCallback(async () => {
    try {
      const res = await vendorApi.getById(id);
      setVendor(res.data);
    } catch (err) {
      toast.error('Failed to load vendor details');
      navigate('/admin/vendors');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <PageHeader title="Vendor Ledger" actionIcon={HiOutlineArrowLeft} onAction={() => navigate('/admin/vendors')} />
        <Card><LoadingSkeleton height="300px" /></Card>
      </div>
    );
  }

  if (!vendor) return null;

  const totalPurchase = vendor.purchaseBills?.reduce((sum, bill) => sum + bill.totalAmount, 0) || 0;

  const columns = [
    { key: 'billNo', label: 'Bill No', render: (val) => <span className="font-semibold text-primary">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'billType', label: 'Type', render: (val) => <Badge variant={val === 'GST' ? 'success' : 'default'}>{val}</Badge> },
    { key: 'totalAmount', label: 'Amount', align: 'right', render: (val) => <span className="font-semibold">{formatCurrency(val)}</span> },
    { key: 'id', label: 'Actions', align: 'right', render: (billId) => (
      <button className="text-gray-500 hover:text-primary transition-colors p-1" onClick={() => navigate(`/admin/purchase-bills/${billId}`)} title="View Bill">
        <HiOutlineEye size={18} />
      </button>
    )},
  ];

  return (
    <div className="page-wrapper">
      <PageHeader 
        title={`${vendor.name} - Ledger`} 
        subtitle="Vendor profile and purchase history"
        actionLabel="Back to Vendors"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/vendors')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1 md:col-span-2">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-4 bg-primary-50 rounded-full text-primary">
              <HiOutlineOfficeBuilding size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{vendor.name}</h2>
              {vendor.gstNumber && <Badge variant="primary" className="mb-2">GSTIN: {vendor.gstNumber}</Badge>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mt-6 border-t pt-4">
            {vendor.phone && (
              <div className="flex items-center gap-2">
                <HiOutlinePhone className="text-gray-400" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-2">
                <HiOutlineMail className="text-gray-400" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <HiOutlineLocationMarker className="text-gray-400 mt-1 flex-shrink-0" />
                <span>{vendor.address} {vendor.state && `, ${vendor.state}`}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center bg-gray-50">
          <h3 className="text-gray-500 font-medium mb-2">Total Purchase Volume</h3>
          <div className="text-4xl font-bold text-gray-800">{formatCurrency(totalPurchase)}</div>
          <div className="text-sm text-gray-500 mt-2">from {vendor.purchaseBills?.length || 0} bills</div>
        </Card>
      </div>

      <Card title="Purchase Bill History" padding={false}>
        <DataTable 
          columns={columns} 
          data={vendor.purchaseBills || []} 
          emptyMessage="No purchase bills recorded for this vendor." 
        />
      </Card>
    </div>
  );
}
