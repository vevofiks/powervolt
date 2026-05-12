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
import { productApi } from '../api/products';
import { accountApi } from '../api/accounts';
import { customerApi } from '../api/customers';
import { salesInvoiceApi } from '../api/salesInvoices';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineArrowLeft, HiOutlineSearch, HiOutlineUserAdd } from 'react-icons/hi';
import './CreateSalesInvoice.css';

export default function CreateSalesInvoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const [invoice, setInvoice] = useState({
    invoiceType: 'NON_GST',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerGstin: '',
    customerAddress1: '',
    customerAddress2: '',
    customerCity: '',
    customerState: '',
    customerPincode: '',
    items: [{ productId: '', productName: '', qty: 1, rate: 0, amount: 0, gstPercent: 0 }],
    discount: 0,
    accountId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [productSearch, setProductSearch] = useState({}); // { index: [results] }
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

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
  const handleCustomerSearch = async (query) => {
    setInvoice(prev => ({ ...prev, customerName: query }));
    if (query.length < 2) {
      setCustomerResults([]);
      setShowCustomerResults(false);
      return;
    }
    try {
      const res = await customerApi.getAll({ search: query });
      setCustomerResults(res.data?.items || []);
      setShowCustomerResults(true);
    } catch (err) {
      console.error(err);
    }
  };

  const selectCustomer = (cust) => {
    setInvoice(prev => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone || '',
      customerGstin: cust.gstin || '',
      customerAddress1: cust.address1 || '',
      customerAddress2: cust.address2 || '',
      customerCity: cust.city || '',
      customerState: cust.state || '',
      customerPincode: cust.pincode || '',
    }));
    setShowCustomerResults(false);
  };

  const handleAddNewCustomer = (custData) => {
    // This is called from the modal, but we just want to fill the form
    setInvoice(prev => ({
      ...prev,
      customerId: '', // Treat as new if explicitly adding from modal
      customerName: custData.name,
      customerPhone: custData.phone,
      customerGstin: custData.gstin,
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
  const handleProductSearch = async (index, query) => {
    // If user types, we should clear the productId until they select a result
    const newItems = [...invoice.items];
    newItems[index].productName = query;
    newItems[index].productId = ''; 
    setInvoice(prev => ({ ...prev, items: newItems }));

    if (query.length < 1) {
      setProductSearch(prev => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await productApi.search(query);
      setProductSearch(prev => ({ ...prev, [index]: res.data || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const selectProduct = (index, product) => {
    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.productName,
      rate: product.salePrice,
      gstPercent: product.gstPercent,
      amount: product.salePrice * newItems[index].qty
    };
    setInvoice(prev => ({ ...prev, items: newItems }));
    setProductSearch(prev => ({ ...prev, [index]: [] }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', qty: 1, rate: 0, amount: 0, gstPercent: 0 }]
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
  const taxAmount = invoice.invoiceType === 'GST' 
    ? invoice.items.reduce((sum, item) => sum + ((parseFloat(item.amount) || 0) * (parseFloat(item.gstPercent) || 0) / 100), 0)
    : 0;
  const totalAmount = subtotal + taxAmount - (parseFloat(invoice.discount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice.customerName) return toast.error('Customer Name is required');
    if (!invoice.accountId) return toast.error('Please select a payment account');
    if (invoice.items.some(item => !item.productId)) return toast.error('Please select products for all items');

    setLoading(true);
    try {
      await salesInvoiceApi.create(invoice);
      toast.success('Invoice created successfully');
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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Input 
                      label="Customer Name *" 
                      placeholder="Type to search or enter new name"
                      value={invoice.customerName} 
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <Button type="button" variant="secondary" icon={HiOutlineUserAdd} onClick={() => setIsCustomerModalOpen(true)} title="Add Detailed Customer">
                    New
                  </Button>
                </div>
                {showCustomerResults && customerResults.length > 0 && (
                  <div className="customer-search-results">
                    {customerResults.map(cust => (
                      <div key={cust.id} className="search-result-item" onClick={() => selectCustomer(cust)}>
                        <div className="res-name">{cust.name}</div>
                        <div className="res-meta">{cust.phone} {cust.city && `| ${cust.city}`}</div>
                      </div>
                    ))}
                  </div>
                )}
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
                value={invoice.customerGstin} 
                onChange={(e) => setInvoice(prev => ({ ...prev, customerGstin: e.target.value }))}
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

            <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
              <Select 
                label="Invoice Type" 
                value={invoice.invoiceType} 
                onChange={(e) => setInvoice(prev => ({ ...prev, invoiceType: e.target.value }))}
                options={[
                  { value: 'GST', label: 'GST Invoice' },
                  { value: 'NON_GST', label: 'Non-GST Invoice' }
                ]}
              />
              <Input 
                label="Invoice Date" 
                type="date" 
                value={invoice.date} 
                onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </Card>

          {/* Items Section */}
          <Card className="invoice-card items-card" title="Items">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th width="100">Qty</th>
                  <th width="150">Rate (₹)</th>
                  <th width="150">Amount (₹)</th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="product-cell">
                      <div className="product-search-container">
                        <input 
                          type="text" 
                          placeholder="Search product..." 
                          className={`item-input ${!item.productId && item.productName ? 'input-error' : ''}`}
                          value={item.productName}
                          onChange={(e) => handleProductSearch(index, e.target.value)}
                          autoComplete="off"
                        />
                        {!item.productId && item.productName && (
                          <div className="input-hint text-danger">Select from results</div>
                        )}
                        {productSearch[index]?.length > 0 && (
                          <div className="search-results">
                            {productSearch[index].map(p => (
                              <div key={p.id} className="search-item" onClick={() => selectProduct(index, p)}>
                                <span className="p-name">{p.productName}</span>
                                <span className="p-price">₹{p.salePrice}</span>
                                <span className="p-stock">Stock: {p.stockQty}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
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
                  {invoice.invoiceType === 'GST' && (
                    <div className="summary-row">
                      <span>GST (CGST + SGST):</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
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
    </div>
  );
}
