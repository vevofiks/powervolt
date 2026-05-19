import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';
import { purchaseBillApi } from '../api/purchaseBills';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlineOfficeBuilding } from 'react-icons/hi';
import '../components/sales/InvoicePrint.css'; // Reusing print styles

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
    window.print();
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <PageHeader title="View Purchase Bill" />
        <Card><LoadingSkeleton height="300px" /></Card>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="page-wrapper">
      <div className="no-print">
        <PageHeader
          title={`Purchase Bill #${bill.billNo}`}
          subtitle={`Recorded on ${formatDate(bill.date)}`}
          actionLabel="Back"
          actionIcon={HiOutlineArrowLeft}
          onAction={() => navigate('/admin/purchase-bills')}
        >
          <Button icon={HiOutlinePrinter} onClick={handlePrint}>Print Bill</Button>
        </PageHeader>
      </div>

      <div className="invoice-print-container" id="printable-invoice">
        <div className="invoice-print-header">
          <div className="company-details">
            <h1 className="company-name">PURCHASE BILL</h1>
            <p className="company-contact text-gray-500">Internal Record</p>
          </div>
          <div className="invoice-meta-details">
            <div className="meta-row"><span className="meta-label">Bill No:</span><span className="meta-value">{bill.billNo}</span></div>
            <div className="meta-row"><span className="meta-label">Date:</span><span className="meta-value">{formatDate(bill.date)}</span></div>
            <div className="meta-row"><span className="meta-label">Type:</span><span className="meta-value">{bill.billType}</span></div>
          </div>
        </div>

        <div className="invoice-print-parties">
          <div className="party-box billed-to">
            <h3 className="party-title">Vendor Details:</h3>
            {bill.vendorId ? (
              <>
                <div className="party-name flex items-center gap-2">
                  <HiOutlineOfficeBuilding /> {bill.vendorName}
                </div>
                {bill.vendor?.address && <div className="party-address">{bill.vendor.address}</div>}
                {bill.vendor?.state && <div className="party-address">{bill.vendor.state}</div>}
                <div className="party-contact">
                  {bill.vendorPhone && <span>Phone: {bill.vendorPhone}</span>}
                  {bill.vendorGstNumber && <span>GSTIN: {bill.vendorGstNumber}</span>}
                </div>
              </>
            ) : (
              <>
                <div className="party-name">{bill.vendorName || 'N/A'}</div>
                {bill.vendorPhone && <div className="party-contact">Phone: {bill.vendorPhone}</div>}
                {bill.vendorGstNumber && <div className="party-contact">GSTIN: {bill.vendorGstNumber}</div>}
              </>
            )}
          </div>
        </div>

        <table className="invoice-print-table">
          <thead>
            <tr>
              <th className="col-sn">#</th>
              <th className="col-desc">Description of Goods</th>
              <th className="col-hsn">SKU</th>
              <th className="col-qty">Qty</th>
              <th className="col-rate">Rate</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index}>
                <td className="col-sn">{index + 1}</td>
                <td className="col-desc font-semibold">{item.productName}</td>
                <td className="col-hsn">{item.sku || '—'}</td>
                <td className="col-qty">{item.qty}</td>
                <td className="col-rate">{formatCurrency(item.purchasePrice)}</td>
                <td className="col-amount">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-print-summary">
          <div className="amount-in-words">
            <p className="font-semibold mb-2">Terms & Notes:</p>
            <p className="text-sm text-gray-600">{bill.notes || '—'}</p>
            <br/>
            <p className="text-sm text-gray-600">Paid from Account: {bill.account?.accountName}</p>
          </div>
          
          <div className="summary-calculations">
            <div className="calc-row">
              <span className="calc-label">Subtotal</span>
              <span className="calc-value">{formatCurrency(bill.subtotal)}</span>
            </div>
            {bill.billType === 'GST' && (
              <>
                <div className="calc-row">
                  <span className="calc-label">CGST (9%)</span>
                  <span className="calc-value">{formatCurrency(bill.taxAmount / 2)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">SGST (9%)</span>
                  <span className="calc-value">{formatCurrency(bill.taxAmount / 2)}</span>
                </div>
              </>
            )}
            <div className="calc-row grand-total-row">
              <span className="calc-label">Total Amount</span>
              <span className="calc-value font-bold text-lg">{formatCurrency(bill.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-print-footer">
          <div className="footer-box text-center">
            <p className="font-semibold mb-8">Receiver's Signature</p>
            <div className="signature-line"></div>
          </div>
          <div className="footer-box text-center">
            <p className="font-semibold mb-8">Authorized Signatory</p>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
