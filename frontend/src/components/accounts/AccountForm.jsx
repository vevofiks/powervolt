import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import './AccountForm.css';

const initialState = {
  accountName: '',
  bankName: '',
  accountNumber: '',
  openingBalance: '',
  notes: '',
};

export default function AccountForm({ account, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const isEdit = !!account;

  useEffect(() => {
    if (account) {
      setForm({
        accountName: account.accountName || '',
        bankName: account.bankName || '',
        accountNumber: account.accountNumber || '',
        openingBalance: account.openingBalance?.toString() || '0',
        notes: account.notes || '',
      });
    }
  }, [account]);

  const validate = () => {
    const newErrors = {};
    if (!form.accountName.trim()) newErrors.accountName = 'Account name is required';
    if (form.openingBalance && isNaN(parseFloat(form.openingBalance))) {
      newErrors.openingBalance = 'Must be a valid number';
    }
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
    onSubmit({
      ...form,
      openingBalance: parseFloat(form.openingBalance) || 0,
    });
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <div className="account-form__grid">
        <Input
          label="Account Name *"
          name="accountName"
          placeholder="e.g., Federal Bank, Cash"
          value={form.accountName}
          onChange={handleChange}
          error={errors.accountName}
          id="input-account-name"
        />
        <Input
          label="Bank Name"
          name="bankName"
          placeholder="e.g., Federal Bank"
          value={form.bankName}
          onChange={handleChange}
          id="input-bank-name"
        />
        <Input
          label="Account Number"
          name="accountNumber"
          placeholder="Optional"
          value={form.accountNumber}
          onChange={handleChange}
          id="input-account-number"
        />
        <Input
          label={isEdit ? 'Opening Balance (read-only)' : 'Opening Balance (₹)'}
          name="openingBalance"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.openingBalance}
          onChange={handleChange}
          error={errors.openingBalance}
          disabled={isEdit}
          id="input-opening-balance"
        />
      </div>

      <div className="account-form__full">
        <label className="account-form__label" htmlFor="input-notes">Notes</label>
        <textarea
          id="input-notes"
          name="notes"
          className="account-form__textarea"
          placeholder="Additional notes about this account..."
          rows={3}
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      <div className="account-form__actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}
