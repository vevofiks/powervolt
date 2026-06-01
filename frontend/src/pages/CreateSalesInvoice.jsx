import { useState, useEffect, useCallback } from 'react';
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
import ProductForm from '../components/products/ProductForm';
import ProductSearchInput from '../components/products/ProductSearchInput';
import { productApi } from '../api/products';
import { accountApi } from '../api/accounts';
import { customerApi } from '../api/customers';
import { salesInvoiceApi } from '../api/salesInvoices';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineArrowLeft, HiOutlineUserAdd, HiOutlineCube } from 'react-icons/hi';
import './CreateSalesInvoice.css';

export default function CreateSalesInvoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalIndex, setProductModalIndex] = useState(null);
  const [productSubmitting, setProductSubmitting] = useState(false);

  const [invoice, setInvoice] = useState({
    invoiceType: 'GST',
    invoiceCategory: 'PRODUCT',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerGstNumber: '',
    customerAddress1: '',
    customerAddress2: '',
    customerCity: '',
    customerState: '',
    customerPincode: '',
    items: [{ itemType: 'PRODUCT', productId: '', productName: '', sku: '', hsnCode: '', qty: 1, rate: 0, amount: 0 }],
    discount: 0,
    accountId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('salesInvoiceDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (window.confirm('You have an unsaved invoice draft. Would you like to restore it?')) {
          setInvoice(parsed);
        } else {
          localStorage.removeItem('salesInvoiceDraft');
        }
      } catch (e) {
        localStorage.removeItem('salesInvoiceDraft');
      }
    }
  }, []);

  // Auto-save draft when invoice changes
  useEffect(() => {
    if (invoice.customerName || invoice.items.some(i => i.productName)) {
      localStorage.setItem('salesInvoiceDraft', JSON.stringify(invoice));
    }
  }, [invoice]);

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
      customerPhone: cust.phone || '',
      customerGstNumber: cust.gstNumber || '',
      customerAddress1: cust.address1 || '',
      customerAddress2: cust.address2 || '',
      customerCity: cust.city || '',
      customerState: cust.state || '',
      customerPincode: cust.pincode || '',
    }));
  };

  const handleAddNewCustomer = (custData) => {
    setInvoice(prev => ({
      ...prev,
      customerId: '',
      customerName: custData.name,
      customerPhone: custData.phone,
      customerGstNumber: custData.gstNumber,
      customerAddress1: custData.address1,
      customerAddress2: custData.address2,
      customerCity: custData.city,
      customerState: custData.state,
      customerPincode: custData.pincode,
    }));
    setIsCustomerModalOpen(false);
    toast.success('Customer details filled. Profile will be saved with invoice.');
  };

  // ─── Product Selection ────────────────────────────────────────
  const handleProductInputChange = (index, value) => {
    const newItems = [...invoice.items];
    newItems[index].productName = value;
    if (newItems[index].productId) {
      newItems[index].productId = '';
    }
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const selectProduct = (index, product) => {
    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.productName,
      sku: product.sku || '',
      hsnCode: product.hsnCode || '',
      rate: product.salePrice,
      amount: product.salePrice * newItems[index].qty
    };
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // ─── Quick Add Product (from modal) ───────────────────────────
  const openProductModal = (index) => {
    setProductModalIndex(index);
    setIsProductModalOpen(true);
  };

  const handleQuickAddProduct = async (productData) => {
    setProductSubmitting(true);
    try {
      const res = await productApi.create(productData);
      const newProduct = res.data;

      // Auto-select the newly created product in the relevant row
      if (productModalIndex !== null) {
        const newItems = [...invoice.items];
        newItems[productModalIndex] = {
          ...newItems[productModalIndex],
          productId: newProduct.id,
          productName: newProduct.productName,
          sku: newProduct.sku || '',
          hsnCode: newProduct.hsnCode || '',
          rate: newProduct.salePrice,
          amount: newProduct.salePrice * newItems[productModalIndex].qty
        };
        setInvoice(prev => ({ ...prev, items: newItems }));
      }

      setIsProductModalOpen(false);
      setProductModalIndex(null);
      toast.success(`Product "${newProduct.productName}" created & added to invoice`);
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setProductSubmitting(false);
    }
  };

  const addItem = () => {
    const itemType = invoice.invoiceCategory || 'PRODUCT';
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { itemType, productId: '', productName: '', sku: '', hsnCode: '', qty: 1, rate: 0, amount: 0 }]
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
    if (field === 'qty' || field === 'rate') {
      newItems[index].amount = newItems[index].qty * newItems[index].rate;
    }
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Calculations
  const subtotal = invoice.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  // Fixed GST: 9% CGST + 9% SGST = 18% total
  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + taxAmount - (parseFloat(invoice.discount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice.customerName) return toast.error('Customer Name is required');
    if (!invoice.accountId) return toast.error('Please select a payment account');
    
    // Validate items based on invoice category
    const isService = invoice.invoiceCategory === 'SERVICE';
    if (!isService && invoice.items.some(item => !item.productId)) {
      return toast.error('Please select products for all items');
    }
    if (isService && invoice.items.some(item => !item.productName.trim())) {
      return toast.error('Please enter descriptions for all service items');
    }

    setLoading(true);
    try {
      await salesInvoiceApi.create(invoice);
      toast.success('Invoice created successfully');
      localStorage.removeItem('salesInvoiceDraft');
      navigate('/admin/sales-invoice');
    } catch (err) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper create-invoice">
      <PageHeader
        title="Create Sales Invoice"
        subtitle="Generate a new GST or Non-GST invoice"
        actionLabel="Back to History"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/sales-invoice')}
      />

      <form onSubmit={handleSubmit}>
        <div className="invoice-grid">
          {/* Customer & Header */}
          <Card className="invoice-card" title="Customer Details">
            <div className="form-grid">
              <div className="customer-selection-field" style={{ position: 'relative', gridColumn: 'span 2' }}>
                <CustomerSearchInput
                  label="Customer Name *"
                  value={invoice.customerName}
                  onChange={handleCustomerInputChange}
                  onSelect={selectCustomer}
                  onQuickAdd={() => setIsCustomerModalOpen(true)}
                  hasError={!invoice.customerName}
                />
              </div>

              <Input
                label="Phone Number"
                placeholder="10-digit number"
                value={invoice.customerPhone}
                onChange={(e) => setInvoice(prev => ({ ...prev, customerPhone: e.target.value, customerId: '' }))}
              />
              <Input
                label="GSTIN"
                placeholder="Optional"
                value={invoice.customerGstNumber}
                onChange={(e) => setInvoice(prev => ({ ...prev, customerGstNumber: e.target.value }))}
              />

              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  label="Address Line 1"
                  placeholder="Street / Area"
                  value={invoice.customerAddress1}
                  onChange={(e) => setInvoice(prev => ({ ...prev, customerAddress1: e.target.value }))}
                />
              </div>

              <Input
                label="City"
                placeholder="Mumbai"
                value={invoice.customerCity}
                onChange={(e) => setInvoice(prev => ({ ...prev, customerCity: e.target.value }))}
              />
              <Input
                label="Pincode"
                placeholder="6-digit"
                value={invoice.customerPincode}
                onChange={(e) => setInvoice(prev => ({ ...prev, customerPincode: e.target.value }))}
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <Input
                label="Invoice Date"
                type="date"
                value={invoice.date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
              />
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Invoice Category *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setInvoice(prev => ({
                      ...prev,
                      invoiceCategory: 'PRODUCT',
                      items: prev.items.map(item => ({ ...item, itemType: 'PRODUCT', productId: '', productName: '', sku: '', hsnCode: '' }))
                    }))}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                      cursor: 'pointer', transition: 'all 0.2s', border: '2px solid',
                      borderColor: invoice.invoiceCategory === 'PRODUCT' ? '#16a34a' : 'var(--color-border)',
                      background: invoice.invoiceCategory === 'PRODUCT' ? '#dcfce7' : 'var(--color-background)',
                      color: invoice.invoiceCategory === 'PRODUCT' ? '#15803d' : 'var(--color-text-secondary)'
                    }}
                  >
                    🏭 PRODUCT
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoice(prev => ({
                      ...prev,
                      invoiceCategory: 'SERVICE',
                      items: prev.items.map(item => ({ ...item, itemType: 'SERVICE', productId: '', productName: '', sku: '', hsnCode: '' }))
                    }))}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                      cursor: 'pointer', transition: 'all 0.2s', border: '2px solid',
                      borderColor: invoice.invoiceCategory === 'SERVICE' ? '#2563eb' : 'var(--color-border)',
                      background: invoice.invoiceCategory === 'SERVICE' ? '#dbeafe' : 'var(--color-background)',
                      color: invoice.invoiceCategory === 'SERVICE' ? '#1d4ed8' : 'var(--color-text-secondary)'
                    }}
                  >
                    🔧 SERVICE
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="invoice-card items-card"
          >
            <div className="items-card-header">
              <span className="items-card-title">Items</span>
              <span
                className="items-mode-badge"
                style={{
                  background: invoice.invoiceCategory === 'SERVICE' ? '#dbeafe' : '#dcfce7',
                  color: invoice.invoiceCategory === 'SERVICE' ? '#1d4ed8' : '#15803d',
                  border: `1px solid ${invoice.invoiceCategory === 'SERVICE' ? '#bfdbfe' : '#bbf7d0'}`
                }}
              >
                {invoice.invoiceCategory === 'SERVICE' ? '🔧 Service Mode' : '🏭 Product Mode'}
              </span>
            </div>
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}>#</th>
                  <th>{invoice.invoiceCategory === 'SERVICE' ? 'Service Description' : 'Product Name'}</th>
                  {invoice.invoiceCategory !== 'SERVICE' && <th width="90">SKU</th>}
                  {invoice.invoiceCategory !== 'SERVICE' && <th width="110">HSN Code</th>}
                  <th width="80">Qty</th>
                  <th width="130">Rate (₹)</th>
                  <th width="130">Amount (₹)</th>
                  <th width="48"></th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600 }}>{index + 1}</td>
                    <td className="product-cell">
                      {invoice.invoiceCategory === 'SERVICE' ? (
                        <input
                          type="text"
                          className="item-input"
                          placeholder="e.g., Installation fee, Repair service..."
                          value={item.productName || ''}
                          onChange={(e) => updateItem(index, 'productName', e.target.value)}
                          required
                        />
                      ) : (
                        <>
                          <ProductSearchInput
                            value={item.productName}
                            onChange={(val) => handleProductInputChange(index, val)}
                            onSelect={(product) => selectProduct(index, product)}
                            onQuickAdd={() => openProductModal(index)}
                            hasError={!item.productId && item.productName}
                          />
                          {!item.productId && item.productName && (
                            <div className="input-hint text-danger" style={{ fontSize: '11px', marginTop: '4px' }}>Select from dropdown or add new</div>
                          )}
                        </>
                      )}
                    </td>
                    {invoice.invoiceCategory !== 'SERVICE' && (
                      <td>
                        <input
                          type="text"
                          className="item-input sku-input"
                          value={item.sku || ''}
                          placeholder="—"
                          readOnly
                        />
                      </td>
                    )}
                    {invoice.invoiceCategory !== 'SERVICE' && (
                      <td>
                        <input
                          type="text"
                          className="item-input hsn-input"
                          value={item.hsnCode || ''}
                          placeholder="—"
                          readOnly
                        />
                      </td>
                    )}
                    <td>
                      <input
                        type="number"
                        className="item-input"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="item-input"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="amount-cell">₹{(item.amount || 0).toFixed(2)}</td>
                    <td>
                      <button type="button" className="remove-item" onClick={() => removeItem(index)}>
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button type="button" variant="secondary" icon={HiOutlinePlus} onClick={addItem} className="add-item-btn">
              Add Item
            </Button>
          </Card>

          {/* Summary & Payment */}
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
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>CGST @ 9%:</span>
                    <span>₹{(taxAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>SGST @ 9%:</span>
                    <span>₹{(taxAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total GST:</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount:</span>
                    <input
                      type="number"
                      className="discount-input"
                      value={invoice.discount}
                      onChange={(e) => setInvoice(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="summary-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="notes-section">
                <Input
                  label="Notes"
                  placeholder="Additional information..."
                  value={invoice.notes}
                  onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="invoice-actions">
                <Button type="submit" loading={loading} icon={HiOutlineSave} size="lg">
                  Save & Print Invoice
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

      {/* Quick Add Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setProductModalIndex(null); }} title="Quick Add Product" size="xl">
        <ProductForm
          onSubmit={handleQuickAddProduct}
          onCancel={() => { setIsProductModalOpen(false); setProductModalIndex(null); }}
          loading={productSubmitting}
        />
      </Modal>
    </div>
  );
}
