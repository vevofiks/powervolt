import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DocumentViewPage from '../components/ui/DocumentViewPage';
import { serviceInvoiceApi } from '../api/serviceInvoices';
import { settingApi } from '../api/settings';
import { formatDate } from '../utils/formatDate';
import { printDocument } from '../utils/printDocument';
import './ServiceInvoicePrint.css';

export default function ViewServiceInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [invRes, settingsRes] = await Promise.all([
          serviceInvoiceApi.getById(id),
          settingApi.get(),
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service invoice? Ledger transaction will be reverted.')) return;
    try {
      await serviceInvoiceApi.delete(id);
      toast.success('Service Invoice deleted');
      navigate('/admin/service-invoice');
    } catch (err) {
      toast.error('Failed to delete service invoice');
    }
  };

  if (!loading && !invoice) return null;

  return (
    <DocumentViewPage
      loading={loading}
      loadingTitle="View Invoice"
      title={`Service Invoice: ${invoice?.invoiceNo || ''}`}
      subtitle={invoice ? `Issued on ${formatDate(invoice.date)}` : undefined}
      onBack={() => navigate('/admin/service-invoice')}
      onPrint={printDocument}
      printLabel="Print Service Invoice"
      onEdit={() => navigate(`/admin/service-invoice/edit/${id}`)}
      editLabel="Edit Invoice"
      onDelete={handleDelete}
      deleteLabel="Delete Invoice"
    >
      {invoice && (
        <div className="service-invoice-preview-container">
          <div className="service-invoice-print-area" data-bill-to-name={invoice.customerName || ''}>
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
      )}
    </DocumentViewPage>
  );
}
