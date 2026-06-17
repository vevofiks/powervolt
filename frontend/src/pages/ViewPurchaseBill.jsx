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
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlineOfficeBuilding, HiOutlineTrash } from 'react-icons/hi';
import stamp from '../assets/official_stamp.jpg';
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
    const originalTitle = document.title;
    document.title = `Purchase_Bill_${bill.billNo}_${(bill.vendorName || 'Vendor').replace(/[^a-zA-Z0-9]/g, '_')}`;
    window.print();
    document.title = originalTitle;
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
          <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
            <Button icon={HiOutlinePrinter} onClick={handlePrint}>Print Bill</Button>
            <Button variant="danger" icon={HiOutlineTrash} onClick={handleDelete}>Delete Bill</Button>
          </div>
        </PageHeader>
      </div>

      <div className="invoice-print-container" id="printable-invoice">
        <div className="invoice-outer-border">
          <div className="invoice-header">
            <div className="header-left">
              <h1 className="company-name text-2xl font-bold mb-1" style={{ color: 'var(--invoice-green)' }}>POWER VOLT</h1>
              <div className="company-tagline">Internal Record</div>
            </div>
            <div className="header-right">
              <h2 className="invoice-type-title">PURCHASE BILL</h2>
              <table className="invoice-meta-table">
                <tbody>
                  <tr><td className="meta-label">Bill No</td><td className="meta-value">{bill.billNo}</td></tr>
                  <tr><td className="meta-label">Date</td><td className="meta-value">{formatDate(bill.date)}</td></tr>
                  <tr><td className="meta-label">Type</td><td className="meta-value">{bill.billType}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="header-divider"></div>

          <div className="bill-to-section">
            <div className="bill-to-header">VENDOR DETAILS</div>
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

          <div className="items-table-wrapper">
            <table className="invoice-items-table">
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
          </div>

          <div className="invoice-summary-section">
            <div className="amount-words-box">
              <span className="words-label">Terms & Notes</span>
              <span className="words-value block mt-1 font-normal text-xs">{bill.notes || '—'}</span>
              <span className="words-label mt-4">Paid from Account</span>
              <span className="words-value block mt-1 font-normal text-xs">{bill.account?.accountName}</span>
            </div>
            
            <div className="totals-box">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td className="label">Subtotal</td>
                    <td className="value">{formatCurrency(bill.subtotal)}</td>
                  </tr>
                  {bill.billType === 'GST' && (
                    <>
                      <tr>
                        <td className="label">CGST (9%)</td>
                        <td className="value">{formatCurrency(bill.taxAmount / 2)}</td>
                      </tr>
                      <tr>
                        <td className="label">SGST (9%)</td>
                        <td className="value">{formatCurrency(bill.taxAmount / 2)}</td>
                      </tr>
                    </>
                  )}
                  {parseFloat(bill.discount) > 0 && (
                    <tr>
                      <td className="label">Discount</td>
                      <td className="value">-{formatCurrency(bill.discount)}</td>
                    </tr>
                  )}
                  <tr className="grand-total-row">
                    <td className="label">Total Amount</td>
                    <td className="value">{formatCurrency(bill.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-bottom-section mt-8">
            <div className="bank-details">
              <h4>Internal Signatures</h4>
              <p>For internal record keeping only.</p>
            </div>
            <div className="signature-area">
              <div className="seal-area">
                <img src={stamp} alt="Company Seal" className="seal-img" />
              </div>
              <div className="authorized-by-col">
                <div className="signature-line"></div>
                <p>Authorized Signatory</p>
                <h4 className="auth-name">POWER VOLT</h4>
              </div>
            </div>
          </div>

          <div className="invoice-footer-note">
            THANK YOU FOR YOUR BUSINESS
          </div>
        </div>
      </div>
    </div>
  );
}
