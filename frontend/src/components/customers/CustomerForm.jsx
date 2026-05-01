import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function CustomerForm({ customer, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address1: customer?.address1 || '',
    city: customer?.city || '',
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
    <form onSubmit={handleSubmit} className="customer-form">
      <div className="form-grid">
        <Input 
          label="Customer Name *" 
          name="name"
          required 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="e.g., John Doe"
        />
        <Input 
          label="Phone Number" 
          name="phone"
          value={formData.phone} 
          onChange={handleChange} 
          placeholder="Contact number"
        />
      </div>

      <div className="form-divider" style={{ margin: '24px 0', borderTop: '1px solid var(--color-border)' }}></div>
      <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>Address & Location</h3>

      <div className="form-grid">
        <Input 
          label="Address" 
          name="address1"
          value={formData.address1} 
          onChange={handleChange} 
          placeholder="Full Address"
        />
        <Input 
          label="Location / City" 
          name="city"
          value={formData.city} 
          onChange={handleChange} 
          placeholder="e.g., Mumbai"
        />
      </div>

      <div className="modal-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{customer ? 'Update Customer' : 'Save Customer'}</Button>
      </div>
    </form>
  );
}
