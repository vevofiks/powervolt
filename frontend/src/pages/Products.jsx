import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ProductForm from '../components/products/ProductForm';
import StockAdjustmentForm from '../components/products/StockAdjustmentForm';
import { productApi } from '../api/products';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineSearch, HiOutlineAdjustments, HiOutlineCube,
  HiOutlineExclamation, HiOutlineClipboardList,
} from 'react-icons/hi';
import './Products.css';

const CATEGORY_LABELS = {
  WIRES: 'Wires', SWITCHES: 'Switches', LIGHTS: 'Lights',
  MOTORS: 'Motors', TOOLS: 'Tools', ACCESSORIES: 'Accessories',
};

const STOCK_TYPE_LABELS = {
  PURCHASE_IN: { label: 'Purchase In', variant: 'success' },
  SALE_OUT: { label: 'Sale Out', variant: 'danger' },
  ADJUSTMENT: { label: 'Adjustment', variant: 'primary' },
  RETURN_IN: { label: 'Return In', variant: 'info' },
  DAMAGE_OUT: { label: 'Damage Out', variant: 'warning' },
};

const categoryFilterOptions = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Stock history
  const [stockHistory, setStockHistory] = useState({ product: null, items: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Low stock
  const [lowStockCount, setLowStockCount] = useState(0);

  // ─── Fetch ──────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      const res = await productApi.getAll(params);
      const items = res.data?.items || [];
      setProducts(items);
      setLowStockCount(items.filter((p) => p.stockQty <= p.lowStockThreshold && p.isActive).length);
    } catch (err) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ─── Handlers ───────────────────────────────────────────────
  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await productApi.create(data);
      toast.success('Product added successfully');
      setShowAddModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.message || 'Failed to add product'); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      await productApi.update(selectedProduct.id, data);
      toast.success('Product updated');
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) { toast.error(err.message || 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.productName}"?`)) return;
    try {
      await productApi.delete(product.id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
  };

  const handleStockAdjustment = async (data) => {
    setSubmitting(true);
    try {
      await productApi.addStockAdjustment(selectedProduct.id, data);
      toast.success('Stock adjusted');
      setShowStockModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.message || 'Failed to adjust stock'); }
    finally { setSubmitting(false); }
  };

  const openHistory = async (product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await productApi.getStockHistory(product.id);
      setStockHistory(res.data || { product: null, items: [] });
    } catch (err) { toast.error(err.message || 'Failed to load history'); }
    finally { setHistoryLoading(false); }
  };

  // ─── Columns ────────────────────────────────────────────────
  const columns = [
    { key: 'productName', label: 'Product', render: (val, row) => (
      <div>
        <span className="font-semibold">{val}</span>
        {row.sku && <span className="products__sku">{row.sku}</span>}
      </div>
    )},
    { key: 'category', label: 'Category', render: (val) => (
      <Badge variant="primary">{CATEGORY_LABELS[val] || val}</Badge>
    )},
    { key: 'purchasePrice', label: 'Purchase', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'salePrice', label: 'Sale', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'gstPercent', label: 'GST', align: 'center', render: (val) => `${val}%` },
    { key: 'stockQty', label: 'Stock', align: 'center', render: (val, row) => {
      const isLow = val <= row.lowStockThreshold;
      return (
        <span className={`products__stock ${isLow ? 'products__stock--low' : ''}`}>
          {val} {row.unit}
          {isLow && <HiOutlineExclamation className="products__stock-icon" />}
        </span>
      );
    }},
    { key: 'id', label: 'Actions', render: (_val, row) => (
      <div className="products__actions">
        <button className="products__action-btn" title="Stock History" onClick={() => openHistory(row)}><HiOutlineClipboardList /></button>
        <button className="products__action-btn" title="Adjust Stock" onClick={() => { setSelectedProduct(row); setShowStockModal(true); }}><HiOutlineAdjustments /></button>
        <button className="products__action-btn" title="Edit" onClick={() => { setSelectedProduct(row); setShowEditModal(true); }}><HiOutlinePencil /></button>
        <button className="products__action-btn products__action-btn--danger" title="Delete" onClick={() => handleDelete(row)}><HiOutlineTrash /></button>
      </div>
    )},
  ];

  const historyColumns = [
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'type', label: 'Type', render: (val) => {
      const info = STOCK_TYPE_LABELS[val] || { label: val, variant: 'default' };
      return <Badge variant={info.variant}>{info.label}</Badge>;
    }},
    { key: 'quantity', label: 'Qty', align: 'center', render: (val, row) => {
      const isOut = ['SALE_OUT', 'DAMAGE_OUT'].includes(row.type);
      return <span className={isOut ? 'text-danger' : 'text-success'}>{isOut ? '-' : '+'}{val}</span>;
    }},
    { key: 'stockAfter', label: 'Stock After', align: 'center' },
    { key: 'reference', label: 'Reference', render: (val) => val || '—' },
    { key: 'remark', label: 'Remark', render: (val) => val || '—' },
  ];

  return (
    <div className="page-wrapper" id="page-products">
      <PageHeader title="Products" subtitle="Manage your product inventory" actionLabel="Add Product" actionIcon={HiOutlinePlus} onAction={() => setShowAddModal(true)} />

      {/* Summary + Filters */}
      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              placeholder="Search products..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              id="input-search-products" 
            />
          </div>
          <select 
            className="products__filter-select" 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            id="select-filter-category"
          >
            {categoryFilterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {lowStockCount > 0 && (
          <div className="products__alert">
            <HiOutlineExclamation /> <span>{lowStockCount} product{lowStockCount > 1 ? 's' : ''} low on stock</span>
          </div>
        )}
      </div>

      {/* Products Table */}
      <Card padding={false}>
        {loading ? (
          <div style={{ padding: 24 }}><LoadingSkeleton height="40px" count={6} /></div>
        ) : (
          <DataTable columns={columns} data={products} emptyMessage="No products found. Add your first product!" />
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product" size="xl">
        <ProductForm onSubmit={handleCreate} onCancel={() => setShowAddModal(false)} loading={submitting} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedProduct(null); }} title="Edit Product" size="xl">
        <ProductForm product={selectedProduct} onSubmit={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedProduct(null); }} loading={submitting} />
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={showStockModal} onClose={() => { setShowStockModal(false); setSelectedProduct(null); }} title="Stock Adjustment" size="md">
        <StockAdjustmentForm product={selectedProduct} onSubmit={handleStockAdjustment} onCancel={() => { setShowStockModal(false); setSelectedProduct(null); }} loading={submitting} />
      </Modal>

      {/* Stock History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => { setShowHistoryModal(false); setSelectedProduct(null); }} title={`Stock History — ${selectedProduct?.productName || ''}`} size="xl">
        <div>
          {selectedProduct && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 16px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>Current Stock</span>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>{stockHistory.product?.stockQty ?? selectedProduct.stockQty} {selectedProduct.unit}</div>
              </div>
              <Button icon={HiOutlineAdjustments} size="sm" variant="secondary" onClick={() => { setShowHistoryModal(false); setShowStockModal(true); }}>Adjust</Button>
            </div>
          )}
          {historyLoading ? (
            <div style={{ padding: 20 }}><LoadingSkeleton height="36px" count={5} /></div>
          ) : (
            <DataTable columns={historyColumns} data={stockHistory.items || []} emptyMessage="No stock movements recorded" />
          )}
        </div>
      </Modal>
    </div>
  );
}
