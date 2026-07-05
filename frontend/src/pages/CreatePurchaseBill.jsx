import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import VendorForm from '../components/vendors/VendorForm';
import VendorSearchInput from '../components/vendors/VendorSearchInput';
import ProductForm from '../components/products/ProductForm';
import ProductSearchInput from '../components/products/ProductSearchInput';
import { productApi } from '../api/products';
import { accountApi } from '../api/accounts';
import { vendorApi } from '../api/vendors';
import { purchaseBillApi } from '../api/purchaseBills';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineArrowLeft, HiOutlineUserAdd, HiOutlineCube } from 'react-icons/hi';
import '../pages/CreateSalesInvoice.css'; // Reusing similar styles

export default function CreatePurchaseBill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalIndex, setProductModalIndex] = useState(null);
  const [productSubmitting, setProductSubmitting] = useState(false);

  const [bill, setBill] = useState({
    billNo: `PB-${Date.now().toString().slice(-6)}`,
    billType: 'NON_GST',
    vendorId: '',
    vendorName: '',
    vendorPhone: '',
    vendorGstNumber: '',
    items: [{ productId: '', productName: '', sku: '', hsnCode: '', qty: 1, purchasePrice: 0, salePrice: 0, amount: 0 }],
    accountId: '',
    discount: 0,
    notes: '',
    terms: '',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'PAID'
  });

  // Load draft on mount (only for new bills)
  useEffect(() => {
    if (isEditMode) return;
    const savedDraft = localStorage.getItem('purchaseBillDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (window.confirm('You have an unsaved purchase bill draft. Would you like to restore it?')) {
          setBill(parsed);
        } else {
          localStorage.removeItem('purchaseBillDraft');
        }
      } catch (e) {
        localStorage.removeItem('purchaseBillDraft');
      }
    }
  }, [isEditMode]);

  // Auto-save draft when bill changes (only for new bills)
  useEffect(() => {
    if (isEditMode) return;
    if (bill.vendorName || bill.items.some(i => i.productName)) {
      localStorage.setItem('purchaseBillDraft', JSON.stringify(bill));
    }
  }, [bill, isEditMode]);

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      const accountsRes = await accountApi.getAll();
      const accountsList = accountsRes.data?.items || [];
      setAccounts(accountsList);

      if (isEditMode) {
        const billRes = await purchaseBillApi.getById(id);
        const billData = billRes.data;
        setBill({
          billNo: billData.billNo,
          billType: billData.billType || 'NON_GST',
          vendorId: billData.vendorId || '',
          vendorName: billData.vendorName || '',
          vendorPhone: billData.vendorPhone || '',
          vendorGstNumber: billData.vendorGstNumber || '',
          items: billData.items.map(item => ({
            id: item.id,
            productId: item.productId || '',
            productName: item.productName || '',
            sku: item.sku || '',
            hsnCode: item.hsnCode || '',
            qty: item.qty || 1,
            purchasePrice: item.purchasePrice || 0,
            salePrice: item.salePrice || 0,
            amount: item.amount || 0
          })),
          accountId: billData.accountId || '',
          discount: billData.discount || 0,
          notes: billData.notes || '',
          terms: billData.terms || '',
          date: new Date(billData.date).toISOString().split('T')[0],
          paymentStatus: billData.paymentStatus || 'PAID'
        });
      } else {
        if (accountsList.length > 0) {
          setBill(prev => ({ ...prev, accountId: accountsList[0].id }));
        }
      }
    } catch (err) {
      toast.error('Failed to load required details');
      navigate('/admin/purchase-bills');
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    initData();
  }, [initData]);

  // ─── Vendor Selection ───────────────────────────────────────
  const handleVendorInputChange = (val) => {
    setBill(prev => ({ ...prev, vendorName: val, vendorId: '' }));
  };

  const selectVendor = (vendor) => {
    setBill(prev => ({
      ...prev,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorPhone: vendor.phone || '',
      vendorGstNumber: vendor.gstNumber || '',
    }));
  };

  const handleAddNewVendor = async (vendorData) => {
    try {
      setLoading(true);
      const res = await vendorApi.create(vendorData);
      const newVendor = res.data || vendorData;
      setBill(prev => ({
        ...prev,
        vendorId: newVendor.id,
        vendorName: newVendor.name,
        vendorPhone: newVendor.phone,
        vendorGstNumber: newVendor.gstNumber,
      }));
      setIsVendorModalOpen(false);
      toast.success('Vendor created and selected');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  // ─── Product Selection ────────────────────────────────────────
  const handleProductInputChange = (index, value) => {
    const newItems = [...bill.items];
    newItems[index].productName = value;
    if (newItems[index].productId) {
      newItems[index].productId = '';
    }
    setBill(prev => ({ ...prev, items: newItems }));
  };

  const selectProduct = (index, product) => {
    const newItems = [...bill.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.productName,
      sku: product.sku || '',
      hsnCode: product.hsnCode || '',
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      amount: product.purchasePrice * newItems[index].qty
    };
    setBill(prev => ({ ...prev, items: newItems }));
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

      if (productModalIndex !== null) {
        const newItems = [...bill.items];
        newItems[productModalIndex] = {
          ...newItems[productModalIndex],
          productId: newProduct.id,
          productName: newProduct.productName,
          sku: newProduct.sku || '',
          hsnCode: newProduct.hsnCode || '',
          purchasePrice: newProduct.purchasePrice,
          salePrice: newProduct.salePrice,
          amount: newProduct.purchasePrice * newItems[productModalIndex].qty
        };
        setBill(prev => ({ ...prev, items: newItems }));
      }

      setIsProductModalOpen(false);
      setProductModalIndex(null);
      toast.success(`Product "${newProduct.productName}" created & added to bill`);
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setProductSubmitting(false);
    }
  };

  const addItem = () => {
    setBill(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', sku: '', hsnCode: '', qty: 1, purchasePrice: 0, salePrice: 0, amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (bill.items.length === 1) return;
    const item = bill.items[index];
    const hasContent = item.productName?.trim() || item.qty > 1 || item.purchasePrice > 0 || item.amount > 0;
    if (hasContent && !window.confirm('Are you sure you want to remove this item?')) return;
    const newItems = bill.items.filter((_, i) => i !== index);
    setBill(prev => ({ ...prev, items: newItems }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...bill.items];
    newItems[index][field] = value;
    if (field === 'qty' || field === 'purchasePrice') {
      newItems[index].amount = newItems[index].qty * newItems[index].purchasePrice;
    }
    setBill(prev => ({ ...prev, items: newItems }));
  };

  // Calculations
  const subtotal = bill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const taxAmount = bill.billType === 'GST' ? subtotal * 0.18 : 0;
  const totalAmount = subtotal + taxAmount - (parseFloat(bill.discount) || 0);

  // Selected account for balance check
  const selectedAccount = accounts.find(acc => acc.id === bill.accountId) || null;
  const hasInsufficientBalance = selectedAccount && bill.paymentStatus === 'PAID' && selectedAccount.currentBalance < totalAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bill.billNo) return toast.error('Bill Number is required');
    if (!bill.accountId) return toast.error('Please select a payment account');
    if (bill.items.some(item => !item.productId)) return toast.error('Please select products for all items');

    // Balance check — only block if payment status is PAID
    if (hasInsufficientBalance) {
      return toast.error(
        `Insufficient balance! Account "${selectedAccount.accountName}" has ₹${selectedAccount.currentBalance.toFixed(2)} but the bill total is ₹${totalAmount.toFixed(2)}.`
      );
    }

    setLoading(true);
    try {
      const payload = { ...bill, subtotal, taxAmount, totalAmount };
      if (isEditMode) {
        await purchaseBillApi.update(id, payload);
        toast.success('Purchase Bill updated successfully');
      } else {
        await purchaseBillApi.create(payload);
        toast.success('Purchase Bill created successfully');
        localStorage.removeItem('purchaseBillDraft');
      }
      navigate('/admin/purchase-bills');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase bill`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper create-invoice">
      <PageHeader
        title={isEditMode ? 'Edit Purchase Bill' : 'Create Purchase Bill'}
        subtitle={isEditMode ? 'Modify vendor purchases, stock and ledgers' : 'Record vendor purchases, manage stock and ledgers'}
        actionLabel="Back to History"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/purchase-bills')}
      />

      <form onSubmit={handleSubmit}>
        <div className="invoice-grid">
          {/* Vendor & Header */}
          <Card className="invoice-card" title="Vendor & Bill Details">
            <div className="form-grid">
              <Input
                label="Bill Number *"
                placeholder="Bill No"
                value={bill.billNo}
                onChange={(e) => setBill(prev => ({ ...prev, billNo: e.target.value }))}
                required
              />
              <Input
                label="Bill Date"
                type="date"
                value={bill.date}
                onChange={(e) => setBill(prev => ({ ...prev, date: e.target.value }))}
              />
              <Select
                label="Bill Type"
                value={bill.billType}
                onChange={(e) => setBill(prev => ({ ...prev, billType: e.target.value }))}
                options={[
                  { value: 'GST', label: 'GST Bill' },
                  { value: 'NON_GST', label: 'Non-GST Bill' }
                ]}
              />

              <div className="customer-selection-field" style={{ position: 'relative', gridColumn: 'span 2' }}>
                <VendorSearchInput
                  label="Vendor Name (Optional)"
                  value={bill.vendorName}
                  onChange={handleVendorInputChange}
                  onSelect={selectVendor}
                  onQuickAdd={() => setIsVendorModalOpen(true)}
                  hasError={!bill.vendorName && bill.vendorId} 
                />
              </div>
            </div>
          </Card>

          {/* Items Section */}
          <Card className="invoice-card items-card" title="Products">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th width="100">SKU</th>
                  <th width="100">HSN</th>
                  <th width="80">Qty</th>
                  <th width="120">Pur. Price (₹)</th>
                  <th width="120">Sale Price (₹)</th>
                  <th width="130">Amount (₹)</th>
                  <th width="60"></th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td className="product-cell">
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
                    </td>
                    <td>
                      <input
                        type="text"
                        className="item-input sku-input"
                        value={item.sku || ''}
                        placeholder="—"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="item-input hsn-input"
                        value={item.hsnCode || ''}
                        placeholder="—"
                        readOnly
                      />
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
                        value={item.purchasePrice}
                        onChange={(e) => updateItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="item-input"
                        value={item.salePrice}
                        onChange={(e) => updateItem(index, 'salePrice', parseFloat(e.target.value) || 0)}
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
                  label="Paying Account *"
                  value={bill.accountId}
                  onChange={(e) => setBill(prev => ({ ...prev, accountId: e.target.value }))}
                  options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountName} (₹${Number(acc.currentBalance).toFixed(2)})` }))}
                />
                {/* Balance warning */}
                {selectedAccount && (
                  <div style={{
                    marginTop: '-8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: hasInsufficientBalance ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${hasInsufficientBalance ? '#fecaca' : '#bbf7d0'}`,
                    color: hasInsufficientBalance ? '#dc2626' : '#15803d'
                  }}>
                    {hasInsufficientBalance ? '⚠️' : '✅'}
                    <span>
                      {hasInsufficientBalance
                        ? `Insufficient balance — ₹${Number(selectedAccount.currentBalance).toFixed(2)} available, ₹${totalAmount.toFixed(2)} needed`
                        : `Available balance: ₹${Number(selectedAccount.currentBalance).toFixed(2)}`
                      }
                    </span>
                  </div>
                )}
                <div className="summary-details">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {bill.billType === 'GST' && (
                    <>
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
                    </>
                  )}
                  <div className="summary-row">
                    <span>Discount:</span>
                    <input
                      type="number"
                      className="discount-input"
                      value={bill.discount}
                      onChange={(e) => setBill(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
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
                  value={bill.notes}
                  onChange={(e) => setBill(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="invoice-actions">
                <Button type="submit" loading={loading} icon={HiOutlineSave} size="lg">
                  {isEditMode ? 'Update Purchase Bill' : 'Save Purchase Bill'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* New Vendor Modal */}
      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Quick Add Vendor" size="lg">
        <VendorForm
          onSubmit={handleAddNewVendor}
          onCancel={() => setIsVendorModalOpen(false)}
          loading={loading}
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
