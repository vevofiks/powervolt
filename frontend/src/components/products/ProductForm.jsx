import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import './ProductForm.css';

const categoryOptions = [
  { value: 'WIRES', label: 'Wires' },
  { value: 'SWITCHES', label: 'Switches' },
  { value: 'LIGHTS', label: 'Lights' },
  { value: 'MOTORS', label: 'Motors' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'ACCESSORIES', label: 'Accessories' },
];

const unitOptions = [
  { value: 'Nos', label: 'Nos (Numbers)' },
  { value: 'Mtr', label: 'Mtr (Meters)' },
  { value: 'Kg', label: 'Kg (Kilograms)' },
  { value: 'Box', label: 'Box' },
  { value: 'Set', label: 'Set' },
  { value: 'Roll', label: 'Roll' },
  { value: 'Pair', label: 'Pair' },
];

const initialState = {
  productName: '',
  category: '',
  sku: '',
  hsnCode: '',
  purchasePrice: '',
  salePrice: '',
  currentStock: '',
  unit: 'Nos',
  lowStockThreshold: '5',
};

export default function ProductForm({ product, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setForm({
        productName: product.productName || '',
        category: product.category || '',
        sku: product.sku || '',
        hsnCode: product.hsnCode || '',
        purchasePrice: product.purchasePrice?.toString() || '0',
        salePrice: product.salePrice?.toString() || '0',
        currentStock: product.currentStock?.toString() || '0',
        unit: product.unit || 'Nos',
        lowStockThreshold: product.lowStockThreshold?.toString() || '5',
      });
    }
  }, [product]);

  const validate = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = 'Product name is required';
    if (!form.category) e.category = 'Category is required';
    if (form.salePrice && parseFloat(form.salePrice) < 0) e.salePrice = 'Must be 0 or more';
    if (form.purchasePrice && parseFloat(form.purchasePrice) < 0) e.purchasePrice = 'Must be 0 or more';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      salePrice: parseFloat(form.salePrice) || 0,
      currentStock: parseFloat(form.currentStock) || 0,
      lowStockThreshold: parseFloat(form.lowStockThreshold) || 5,
    });
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="product-form__grid">
        <Input label="Product Name *" name="productName" placeholder="e.g., Finolex 1.5mm Wire" value={form.productName} onChange={handleChange} error={errors.productName} id="input-product-name" />
        <Select label="Category *" name="category" value={form.category} onChange={handleChange} options={categoryOptions} error={errors.category} id="select-category" />
        <Input label="SKU" name="sku" placeholder="Optional" value={form.sku} onChange={handleChange} id="input-sku" />
        <Input label="HSN Code" name="hsnCode" placeholder="e.g., 8544" value={form.hsnCode} onChange={handleChange} id="input-hsn" />
      </div>

      <div className="product-form__divider" />

      <div className="product-form__grid">
        <Input label="Purchase Price (₹)" name="purchasePrice" type="number" step="0.01" placeholder="0.00" value={form.purchasePrice} onChange={handleChange} error={errors.purchasePrice} id="input-purchase-price" />
        <Input label="Sale Price (₹)" name="salePrice" type="number" step="0.01" placeholder="0.00" value={form.salePrice} onChange={handleChange} error={errors.salePrice} id="input-sale-price" />
        <Select label="Unit" name="unit" value={form.unit} onChange={handleChange} options={unitOptions} id="select-unit" />
        <Input label={isEdit ? 'Stock (read-only)' : 'Opening Stock'} name="currentStock" type="number" step="0.01" placeholder="0" value={form.currentStock} onChange={handleChange} disabled={isEdit} id="input-stock" />
        <Input label="Low Stock Alert" name="lowStockThreshold" type="number" step="1" placeholder="5" value={form.lowStockThreshold} onChange={handleChange} id="input-low-stock" />
      </div>

      <div className="product-form__actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Product' : 'Add Product'}</Button>
      </div>
    </form>
  );
}
