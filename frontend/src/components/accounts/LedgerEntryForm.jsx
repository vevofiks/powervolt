import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const moduleOptions = [
  { value: 'ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'TRANSFER', label: 'Transfer' },
];

const typeOptions = [
  { value: 'CREDIT', label: 'Money In (Credit)' },
  { value: 'DEBIT', label: 'Money Out (Debit)' },
];

export default function LedgerEntryForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    moduleType: 'ADJUSTMENT',
    type: 'CREDIT',
    amount: '',
    referenceNo: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.moduleType) newErrors.moduleType = 'Module type is required';
    if (!form.type) newErrors.type = 'Credit/Debit selection is required';
    if (!form.amount || parseFloat(form.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!form.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const amount = parseFloat(form.amount);
    onSubmit({
      date: form.date,
      moduleType: form.moduleType,
      referenceNo: form.referenceNo,
      description: form.description,
      credit: form.type === 'CREDIT' ? amount : 0,
      debit: form.type === 'DEBIT' ? amount : 0
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Select
          label="Transaction Type *"
          name="type"
          value={form.type}
          onChange={handleChange}
          options={typeOptions}
          error={errors.type}
          id="select-ledger-type"
        />
        <Select
          label="Source Module *"
          name="moduleType"
          value={form.moduleType}
          onChange={handleChange}
          options={moduleOptions}
          error={errors.moduleType}
          id="select-ledger-module"
        />
        <Input
          label="Amount (₹) *"
          name="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={handleChange}
          error={errors.amount}
          id="input-ledger-amount"
        />
        <Input
          label="Date *"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          error={errors.date}
          id="input-ledger-date"
        />
        <Input
          label="Reference"
          name="referenceNo"
          placeholder="Invoice no, receipt, etc."
          value={form.referenceNo}
          onChange={handleChange}
          id="input-ledger-reference"
        />
      </div>
      <Input
        label="Description"
        name="description"
        placeholder="Additional notes..."
        value={form.description}
        onChange={handleChange}
        id="input-ledger-desc"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-light)' }}>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Record Transaction</Button>
      </div>
    </form>
  );
}
