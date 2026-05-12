import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import CustomerForm from '../components/customers/CustomerForm';
import { customerApi } from '../api/customers';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineSearch, HiOutlineDownload } from 'react-icons/hi';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAll({ search: searchQuery });
      setCustomers(res.data?.items || []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await customerApi.create(data);
      toast.success('Customer added successfully');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to add customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      await customerApi.update(editingCustomer.id, data);
      toast.success('Customer updated');
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? Customers with invoice history cannot be deleted.')) return;
    try {
      await customerApi.delete(id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Customer Name', render: (val, row) => (
      <div className="customer-info">
        <span className="font-semibold">{val}</span>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (val) => val || '—' },
    { key: 'address1', label: 'Address', render: (val) => val || '—' },
    { key: 'city', label: 'Location', render: (val) => val || '—' },
    { key: '_count', label: 'Invoices', align: 'center', render: (val) => val?.salesInvoices || 0 },
    { key: 'id', label: 'Actions', align: 'right', render: (id, row) => (
      <div className="action-buttons">
        <button className="action-btn primary" onClick={() => navigate(`/admin/customers/${id}`)} title="View Profile"><HiOutlineEye /></button>
        <button className="action-btn" onClick={() => { setEditingCustomer(row); setIsModalOpen(true); }} title="Edit"><HiOutlinePencil /></button>
        <button className="action-btn danger" onClick={() => handleDelete(id)} title="Delete"><HiOutlineTrash /></button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper customers-page">
      <PageHeader 
        title="Customer Management" 
        subtitle="Manage your clients, contact details, and credit history"
        actionLabel="Add Customer"
        actionIcon={HiOutlinePlus}
        onAction={() => { setEditingCustomer(null); setIsModalOpen(true); }}
      >
        <Button variant="secondary" icon={HiOutlineDownload} onClick={() => window.print()}>Export List</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, phone or GSTIN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div style={{ padding: 24 }}><LoadingSkeleton height="40px" count={6} /></div>
        ) : (
          <DataTable 
            columns={columns} 
            data={customers} 
            emptyMessage="No customers found. Add your first customer!" 
          />
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }} 
        title={editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
        size="lg"
      >
        <CustomerForm 
          customer={editingCustomer} 
          onSubmit={editingCustomer ? handleUpdate : handleCreate} 
          onCancel={() => { setIsModalOpen(false); setEditingCustomer(null); }}
          loading={submitting}
        />
      </Modal>
    </div>
  );
}
