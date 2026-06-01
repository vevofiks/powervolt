import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { salesInvoiceApi } from '../api/salesInvoices';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlinePrinter, HiOutlineTrash, HiOutlineSearch, HiOutlineChat, HiOutlineTag, HiOutlineCube, HiOutlineViewGrid } from 'react-icons/hi';
import InvoicePrint from '../components/sales/InvoicePrint';
import './SalesInvoice.css';

const TABS = [
  { key: 'ALL', label: 'All Invoices', icon: HiOutlineViewGrid },
  { key: 'PRODUCT', label: 'Product Invoices', icon: HiOutlineCube },
  { key: 'SERVICE', label: 'Service Invoices', icon: HiOutlineTag },
];

export default function SalesInvoice() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (activeTab !== 'ALL') params.invoiceCategory = activeTab;
      const res = await salesInvoiceApi.getAll(params);
      setInvoices(res.data?.items || []);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice? Stock and ledger will be reverted.')) return;
    try {
      await salesInvoiceApi.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  };

  const handlePaymentStatusChange = async (id, newStatus) => {
    try {
      await salesInvoiceApi.updatePaymentStatus(id, newStatus);
      toast.success('Payment status updated');
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paymentStatus: newStatus } : inv));
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPrintModal(true);
  };

  const handleWhatsApp = (invoice) => {
    const phone = invoice.customerPhone || '';
    if (!phone) return toast.error('No customer phone number available');
    const message = `Hi ${invoice.customerName || 'Customer'}, here is your invoice ${invoice.invoiceNo} from Power Volt. Total Amount: ₹${invoice.totalAmount}. Thank you for your business!`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'customerName', label: 'Customer', render: (val, row) => val || row.customerPhone || 'Walk-in' },
    { key: 'totalAmount', label: 'Total', align: 'right', render: (val) => formatCurrency(val) },
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
    { key: 'id', label: 'Actions', render: (_, row) => (
      <div className="action-buttons">
        <button className="action-btn" title="View/Print" onClick={() => handlePrint(row)}><HiOutlinePrinter /></button>
        <button className="action-btn" title="WhatsApp Share" onClick={() => handleWhatsApp(row)}><HiOutlineChat /></button>
        <button className="action-btn danger" title="Delete" onClick={() => handleDelete(row.id)}><HiOutlineTrash /></button>
      </div>
    )},
  ];

  const tabCounts = {
    ALL: invoices.length, // Only current filter count; for live count you'd need a separate API call
  };

  return (
    <div className="page-wrapper sales-invoice-page">
      <PageHeader 
        title="Sales Invoices" 
        subtitle="Manage your sales history and billing"
        actionLabel="Create Invoice"
        actionIcon={HiOutlinePlus}
        onAction={() => navigate('/admin/sales-invoice/create')}
      />

      {/* Category Tabs */}
      <div className="invoice-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`invoice-tab-btn ${activeTab === tab.key ? 'active' : ''} invoice-tab-btn--${tab.key.toLowerCase()}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="tab-icon" />
              <span>{tab.label}</span>
              {activeTab === tab.key && <span className="tab-count">{invoices.length}</span>}
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by invoice no or customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card padding={false}>
        <DataTable 
          columns={columns} 
          data={invoices} 
          loading={loading}
          emptyMessage={`No ${activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} invoices found. Start by creating one!`}
        />
      </Card>

      <Modal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)} 
        title="Print Invoice"
        size="xl"
      >
        {selectedInvoice && (
          <div className="print-modal-content">
            <div className="print-actions">
              <Button 
                onClick={() => {
                  const originalTitle = document.title;
                  const safeCustomerName = (selectedInvoice.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
                  document.title = `${safeCustomerName}_${selectedInvoice.invoiceNo}`;
                  window.print();
                  document.title = originalTitle;
                }} 
                icon={HiOutlinePrinter}
              >
                Print Now
              </Button>
            </div>
            <div className="print-preview-container">
              <InvoicePrint invoice={selectedInvoice} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
