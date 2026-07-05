import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { serviceInvoiceApi } from '../api/serviceInvoices';
import { settingApi } from '../api/settings';
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlinePencil } from 'react-icons/hi';
import { formatDate } from '../utils/formatDate';
import './ServiceInvoicePrint.css';

export default function ViewServiceInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [invRes, settingsRes] = await Promise.all([
          serviceInvoiceApi.getById(id),
          settingApi.get()
        ]);
        setInvoice(invRes.data);
        setSettings(settingsRes.data);
      } catch (err) {
        toast.error('Failed to load invoice details');
        navigate('/admin/service-invoice');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

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

      <div className="print-actions mb-4 flex justify-end gap-2" style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={() => navigate(`/admin/service-invoice/edit/${id}`)} icon={HiOutlinePencil} variant="secondary" size="lg">
          Edit Invoice
        </Button>
        <Button onClick={handlePrint} icon={HiOutlinePrinter} size="lg">
          Print Service Invoice
        </Button>
      </div>

      <div className="service-invoice-preview-container">
        <div className="service-invoice-print-area" ref={printRef}>
          <div className="si-header-title-centered">INVOICE</div>

          <div className="si-meta-row">
            <div className="si-bill-to-section">
              <div className="si-bill-to-title">BILL TO :</div>
              <div className="si-customer-name">{invoice.customerName}</div>
            </div>

            <div className="si-header-meta-right">
              <div><strong>Invoice Date :</strong> {formatDate(invoice.date)}</div>
              <div><strong>INVOICE NO :</strong> {invoice.invoiceNo}</div>
            </div>
          </div>

          <div className="si-table-container">
            <table className="si-modern-table">
              <thead>
                <tr>
                  <th className="text-center w-16">NO</th>
                  <th className="text-left">DESCRIPTION</th>
                  <th className="text-center w-24">Qty</th>
                  <th className="text-right w-32">Rate</th>
                  <th className="text-right w-36">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td className="text-left" style={{ whiteSpace: 'pre-wrap' }}>{item.description}</td>
                    <td className="text-center">{item.qty !== null && item.qty !== undefined ? item.qty : ''}</td>
                    <td className="text-right">
                      {item.rate !== null && item.rate !== undefined ? `₹ ${item.rate.toFixed(2)}` : ''}
                    </td>
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

          <div className="invoice-bottom-section">
            {/* Column 1: Bank Details */}
            <div className="bank-details">
              <h4>Bank Details</h4>
              <p>Bank: {invoice.account?.bankName || 'Federal Bank - Manjeri'}</p>
              <p>Name: {invoice.account?.accountName || 'POWER VOLT'}</p>
              <p>A/C No: {invoice.account?.accountNumber || '13650200030606'}</p>
              <p>IFSC: {invoice.account?.ifscCode || 'FDRL0001365'}</p>
              <p>PAN: {invoice.account?.panCardNumber || settings?.companyPan || 'ANAPL6617R'}</p>
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
