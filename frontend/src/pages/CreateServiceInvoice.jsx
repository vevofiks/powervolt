import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerSearchInput from '../components/customers/CustomerSearchInput';
import { accountApi } from '../api/accounts';
import { serviceInvoiceApi } from '../api/serviceInvoices';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineArrowLeft } from 'react-icons/hi';
import './CreateSalesInvoice.css'; // Reusing layout css

export default function CreateServiceInvoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [invoice, setInvoice] = useState({
    invoiceNo: '',
    customerId: '',
    customerName: '',
    items: [{ description: '', amount: '' }],
    accountId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await accountApi.getAll();
      setAccounts(res.data?.items || []);
      if (res.data?.items?.length > 0) {
        setInvoice(prev => ({ ...prev, accountId: res.data.items[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load accounts');
    }
  };

  // ─── Customer Selection ───────────────────────────────────────
  const handleCustomerInputChange = (val) => {
    setInvoice(prev => ({ ...prev, customerName: val, customerId: '' }));
  };

  const selectCustomer = (cust) => {
    setInvoice(prev => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.name,
    }));
  };

  const handleAddNewCustomer = (custData) => {
    setInvoice(prev => ({
      ...prev,
      customerId: '',
      customerName: custData.name,
    }));
    setIsCustomerModalOpen(false);
    toast.success('Customer profile ready to be saved with invoice.');
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', amount: '' }]
    }));
  };

  const removeItem = (index) => {
    if (invoice.items.length === 1) return;
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const totalAmount = invoice.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice.customerName) return toast.error('Customer Name is required');
    if (!invoice.accountId) return toast.error('Please select an account');
    
    setLoading(true);
    try {
      const payload = { ...invoice, totalAmount };
      await serviceInvoiceApi.create(payload);
      toast.success('Service Invoice created successfully');
      navigate('/admin/service-invoice');
    } catch (err) {
      toast.error(err.message || 'Failed to create service invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper create-invoice">
      <PageHeader
        title="Create Service Invoice"
        subtitle="Generate a free-text invoice for services rendered"
        actionLabel="Back to History"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/service-invoice')}
      />

      <form onSubmit={handleSubmit}>
        <div className="invoice-grid">
          <Card className="invoice-card" title="Customer Details">
            <div className="form-grid">
              <Input
                label="Invoice Number *"
                placeholder="e.g. SV-0001"
                value={invoice.invoiceNo}
                onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNo: e.target.value }))}
                required
              />
              <div className="customer-selection-field" style={{ position: 'relative' }}>
                <CustomerSearchInput
                  label="Customer Name *"
                  value={invoice.customerName}
                  onChange={handleCustomerInputChange}
                  onSelect={selectCustomer}
                  onQuickAdd={() => setIsCustomerModalOpen(true)}
                  hasError={!invoice.customerName}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  label="Invoice Date"
                  type="date"
                  value={invoice.date}
                  onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          <Card className="invoice-card items-card" title="Service Items">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Description of Work</th>
                  <th width="200">Amount (₹) *</th>
                  <th width="60"></th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Input
                        placeholder="e.g., Light work, Extruder work"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateItem(index, 'amount', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <button type="button" className="remove-item" onClick={() => removeItem(index)} style={{ marginTop: '10px' }}>
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button type="button" variant="secondary" icon={HiOutlinePlus} onClick={addItem} className="add-item-btn mt-4">
              Add Item
            </Button>
          </Card>

          <div className="invoice-bottom">
            <Card className="invoice-card summary-card" title="Payment & Summary">
              <div className="summary-grid">
                <Select
                  label="Receiving Account *"
                  value={invoice.accountId}
                  onChange={(e) => setInvoice(prev => ({ ...prev, accountId: e.target.value }))}
                  options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountName} (₹${acc.currentBalance})` }))}
                />
                <div className="summary-details">
                  <div className="summary-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="invoice-actions mt-6">
                <Button type="submit" loading={loading} icon={HiOutlineSave} size="lg">
                  Save Service Invoice
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* New Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Quick Add Customer Profile" size="lg">
        <CustomerForm
          onSubmit={handleAddNewCustomer}
          onCancel={() => setIsCustomerModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
