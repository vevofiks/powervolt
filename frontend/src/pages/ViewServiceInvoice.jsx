import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { serviceInvoiceApi } from '../api/serviceInvoices';
import { HiOutlinePrinter, HiOutlineArrowLeft } from 'react-icons/hi';
import { formatDate } from '../utils/formatDate';
import './ServiceInvoicePrint.css';

export default function ViewServiceInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await serviceInvoiceApi.getById(id);
      setInvoice(res.data);
    } catch (err) {
      toast.error('Failed to load invoice');
      navigate('/admin/service-invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${invoice.invoiceNo}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    window.print();
    document.title = originalTitle;
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <PageHeader title="Loading Invoice..." />
        <Card><LoadingSkeleton height="400px" /></Card>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Service Invoice: ${invoice.invoiceNo}`}
        actionLabel="Back to Invoices"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/service-invoice')}
      />

      <div className="print-actions mb-4 flex justify-end">
        <Button onClick={handlePrint} icon={HiOutlinePrinter} size="lg">
          Print Service Invoice
        </Button>
      </div>

      <div className="service-invoice-preview-container">
        <div className="service-invoice-print-area" ref={printRef}>
          <div className="si-header-container">
            <div className="si-header-title">SERVICE INVOICE</div>
            <div className="si-header-meta">
              <div><strong>Invoice No:</strong> {invoice.invoiceNo}</div>
              <div><strong>Date:</strong> {formatDate(invoice.date)}</div>
            </div>
          </div>

          <div className="si-bill-to-section">
            <div className="si-section-title">BILL TO</div>
            <div className="si-customer-name">{invoice.customerName}</div>
          </div>

          <div className="si-table-container">
            <table className="si-modern-table">
              <thead>
                <tr>
                  <th className="text-center w-12">#</th>
                  <th className="text-left">Description of Service</th>
                  <th className="text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td className="text-left">{item.description}</td>
                    <td className="text-right font-medium">₹ {item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="si-totals-container">
              <div className="si-total-row">
                <span className="si-total-label">Total Amount</span>
                <span className="si-total-value">₹ {invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="si-bank-section">
            <div className="si-section-title">PAYMENT INFORMATION</div>
            <div className="si-bank-grid">
              <div className="si-bank-item">
                <span>Bank</span>
                <strong>{invoice.account?.bankName || 'CANARA BANK'}</strong>
              </div>
              <div className="si-bank-item">
                <span>Account Name</span>
                <strong>{invoice.account?.accountName || '—'}</strong>
              </div>
              <div className="si-bank-item">
                <span>A/C Number</span>
                <strong>{invoice.account?.accountNumber || '—'}</strong>
              </div>
              <div className="si-bank-item">
                <span>IFSC Code</span>
                <strong>{invoice.account?.ifscCode || '—'}</strong>
              </div>
              <div className="si-bank-item">
                <span>Branch</span>
                <strong>{invoice.account?.branch || '—'}</strong>
              </div>
              <div className="si-bank-item">
                <span>PAN Card</span>
                <strong>{/* Add PAN here if available in context, else keep empty */}—</strong>
              </div>
            </div>
          </div>

          <div className="si-footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
