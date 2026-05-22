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
          <div className="si-header text-center font-bold underline text-xl mb-6">
            INVOICE
          </div>

          <div className="si-top-info flex justify-between mb-8 text-sm">
            <div className="si-bill-to w-1/2 font-bold uppercase">
              <div className="mb-2">BILL TO :</div>
              <div className="ml-4 whitespace-pre-wrap">{invoice.customerName}</div>
            </div>
            <div className="si-meta w-1/2 text-right font-bold uppercase text-xs">
              <div>Invoice Date : {formatDate(invoice.date)}</div>
              <div>INVOICE NO : {invoice.invoiceNo}</div>
            </div>
          </div>

          <table className="si-table w-full border-collapse border border-black text-sm mb-0">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black p-2 w-16 text-center uppercase">NO</th>
                <th className="border-r border-black p-2 text-center uppercase">DESCRIPTION</th>
                <th className="p-2 w-32 text-center uppercase">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border-r border-black p-4 text-center align-top font-bold">{idx + 1}</td>
                  <td className="border-r border-black p-4 align-top font-bold">{item.description}</td>
                  <td className="p-4 align-top text-center font-bold">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {/* Clean professional spacer instead of huge filler row */}
              <tr className="h-32">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
              <tr className="border-t border-black">
                <td className="border-r border-black"></td>
                <td className="border-r border-black p-2 text-right font-bold uppercase">TOTAL</td>
                <td className="p-2 text-center font-bold">{invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Bank Details Table aligned perfectly with the main table */}
          <table className="si-table w-full border-collapse border border-black text-sm mt-8 font-bold uppercase">
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 text-center w-1/2">PAN CARD NUMBER</td>
                <td className="p-2 text-center w-1/2"></td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 text-center">BANK</td>
                <td className="p-2 text-center">{invoice.account?.bankName || 'CANARA BANK'}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 text-center">BRANCH</td>
                <td className="p-2 text-center">{invoice.account?.branch || ''}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 text-center">AC NUMBER</td>
                <td className="p-2 text-center">{invoice.account?.accountNumber || ''}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 text-center">IFSC CODE</td>
                <td className="p-2 text-center">{invoice.account?.ifscCode || ''}</td>
              </tr>
              <tr>
                <td className="border-r border-black p-2 text-center">NAME</td>
                <td className="p-2 text-center">{invoice.account?.accountName || ''}</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
