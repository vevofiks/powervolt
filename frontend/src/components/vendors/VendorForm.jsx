import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function VendorForm({ vendor, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    phone: vendor?.phone || '',
    gstNumber: vendor?.gstNumber || '',
    address: vendor?.address || '',
    state: vendor?.state || '',
    email: vendor?.email || '',
    notes: vendor?.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="vendor-form">
      <div className="form-grid">
        <Input 
          label="Vendor Name *" 
          name="name"
          required 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="e.g., ABC Electronics"
        />
        <Input 
          label="Phone Number" 
          name="phone"
          value={formData.phone} 
          onChange={handleChange} 
          placeholder="Contact number"
        />
        <Input 
          label="GST Number" 
          name="gstNumber"
          value={formData.gstNumber} 
          onChange={handleChange} 
          placeholder="e.g., 29ABCDE1234F1Z5"
        />
        <Input 
          label="Email (Optional)" 
          name="email"
          type="email"
          value={formData.email} 
          onChange={handleChange} 
          placeholder="vendor@example.com"
        />
      </div>

      <div className="form-divider" style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
      <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>Address & Location</h3>

      <div className="form-grid">
        <Input 
          label="Address" 
          name="address"
          value={formData.address} 
          onChange={handleChange} 
          placeholder="Full Address"
        />
        <Input 
          label="State" 
          name="state"
          value={formData.state} 
          onChange={handleChange} 
          placeholder="e.g., Maharashtra"
        />
        <Input 
          label="Notes (Optional)" 
          name="notes"
          value={formData.notes} 
          onChange={handleChange} 
          placeholder="Any extra details"
        />
      </div>

      <div className="modal-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{vendor ? 'Update Vendor' : 'Save Vendor'}</Button>
      </div>
    </form>
  );
}
