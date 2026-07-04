import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import './AccountForm.css';

const initialState = {
  accountName: '',
  bankName: '',
  accountNumber: '',
  branch: '',
  ifscCode: '',
  panCardNumber: '',
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
        branch: account.branch || '',
        ifscCode: account.ifscCode || '',
        panCardNumber: account.panCardNumber || '',
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
    if (form.panCardNumber.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(form.panCardNumber.trim())) {
        newErrors.panCardNumber = 'Invalid PAN format. Expected format: ABCDE1234F';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'panCardNumber') {
      value = value.toUpperCase();
    }
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
          label="Branch"
          name="branch"
          placeholder="Optional"
          value={form.branch}
          onChange={handleChange}
        />
        <Input
          label="IFSC Code"
          name="ifscCode"
          placeholder="Optional"
          value={form.ifscCode}
          onChange={handleChange}
        />
        <Input
          label="PAN Card Number"
          name="panCardNumber"
          placeholder="Optional (e.g., ABCDE1234F)"
          value={form.panCardNumber}
          onChange={handleChange}
          error={errors.panCardNumber}
          maxLength={10}
          id="input-pan-card-number"
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
