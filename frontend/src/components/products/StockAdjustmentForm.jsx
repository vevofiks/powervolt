import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const typeOptions = [
  { value: 'PURCHASE_IN', label: 'Purchase In (+)' },
  { value: 'SALE_OUT', label: 'Sale Out (-)' },
  { value: 'ADJUSTMENT', label: 'Adjustment (+)' },
  { value: 'RETURN_IN', label: 'Return In (+)' },
  { value: 'DAMAGE_OUT', label: 'Damage Out (-)' },
];

export default function StockAdjustmentForm({ product, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ type: '', quantity: '', reference: '', remark: '', date: new Date().toISOString().split('T')[0] });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.type) e.type = 'Type is required';
    if (!form.quantity || parseFloat(form.quantity) <= 0) e.quantity = 'Must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, quantity: parseFloat(form.quantity) });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {product && (
        <div style={{ padding: '12px 16px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)' }}>
          <strong>{product.productName}</strong> — Current Stock: <strong>{product.stockQty} {product.unit}</strong>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Select label="Movement Type *" name="type" value={form.type} onChange={handleChange} options={typeOptions} error={errors.type} id="select-stock-type" />
        <Input label="Quantity *" name="quantity" type="number" step="0.01" placeholder="0" value={form.quantity} onChange={handleChange} error={errors.quantity} id="input-stock-qty" />
        <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} id="input-stock-date" />
        <Input label="Reference" name="reference" placeholder="PO number, etc." value={form.reference} onChange={handleChange} id="input-stock-ref" />
      </div>
      <Input label="Remark" name="remark" placeholder="Notes..." value={form.remark} onChange={handleChange} id="input-stock-remark" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-light)' }}>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Record Adjustment</Button>
      </div>
    </form>
  );
}
