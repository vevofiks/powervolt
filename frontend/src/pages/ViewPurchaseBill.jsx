import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DocumentViewPage from '../components/ui/DocumentViewPage';
import InvoicePrint from '../components/sales/InvoicePrint';
import { purchaseBillApi } from '../api/purchaseBills';
import { formatDate } from '../utils/formatDate';
import { printDocument } from '../utils/printDocument';

export default function ViewPurchaseBill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await purchaseBillApi.getById(id);
        setBill(res.data);
      } catch (err) {
        toast.error('Failed to load bill details');
        navigate('/admin/purchase-bills');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id, navigate]);

  const handlePrint = () => {
    printDocument();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this purchase bill? This will revert product stock levels and account balances associated with this bill.')) return;
    try {
      await purchaseBillApi.delete(id);
      toast.success('Purchase bill deleted successfully');
      navigate('/admin/purchase-bills');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete purchase bill');
    }
  };

  if (!loading && !bill) return null;

  const printInvoice = bill && {
    invoiceNo: bill.billNo,
    date: bill.date,
    invoiceType: bill.billType,
    customerName: bill.vendorName || bill.vendor?.name,
    customerPhone: bill.vendorPhone || bill.vendor?.phone,
    customerGstNumber: bill.vendorGstNumber || bill.vendor?.gstNumber,
    customerAddress1: bill.vendor?.address,
    customerState: bill.vendor?.state,
    items: (bill.items || []).map((item) => ({
      productName: item.productName,
      hsnCode: item.sku,
      qty: item.qty,
      rate: item.purchasePrice,
      amount: item.amount,
    })),
    subtotal: bill.subtotal,
    discount: bill.discount,
    taxAmount: bill.taxAmount,
    totalAmount: bill.totalAmount,
    notes: bill.notes,
    account: bill.account,
  };

  return (
    <DocumentViewPage
      loading={loading}
      loadingTitle="View Purchase Bill"
      title={`Purchase Bill #${bill?.billNo || ''}`}
      subtitle={bill ? `Recorded on ${formatDate(bill.date)}` : undefined}
      onBack={() => navigate('/admin/purchase-bills')}
      onPrint={handlePrint}
      printLabel="Print Bill"
      onEdit={() => navigate(`/admin/purchase-bills/edit/${id}`)}
      editLabel="Edit Bill"
      onDelete={handleDelete}
      deleteLabel="Delete Bill"
    >
      {printInvoice && <InvoicePrint invoice={printInvoice} variant="purchase" />}
    </DocumentViewPage>
  );
}
