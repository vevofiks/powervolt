import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import VendorForm from '../components/vendors/VendorForm';
import { vendorApi } from '../api/vendors';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineDownload } from 'react-icons/hi';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getAll({ search: searchQuery });
      setVendors(res.data || []);
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await vendorApi.create(data);
      toast.success('Vendor added successfully');
      setIsModalOpen(false);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      await vendorApi.update(editingVendor.id, data);
      toast.success('Vendor updated');
      setIsModalOpen(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? Vendors with existing purchase bills cannot be deleted.')) return;
    try {
      await vendorApi.delete(id);
      toast.success('Vendor deleted');
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Vendor Name', render: (val, row) => (
      <div className="font-semibold">{val}</div>
    )},
    { key: 'phone', label: 'Phone', render: (val) => val || '—' },
    { key: 'gstNumber', label: 'GST Number', render: (val) => val || '—' },
    { key: 'address', label: 'Address', render: (val) => val || '—' },
    { key: 'id', label: 'Actions', align: 'right', render: (id, row) => (
      <div className="flex gap-2 justify-end">
        <button className="text-gray-500 hover:text-primary transition-colors p-1" onClick={() => { setEditingVendor(row); setIsModalOpen(true); }} title="Edit"><HiOutlinePencil size={18} /></button>
        <button className="text-gray-500 hover:text-red-500 transition-colors p-1" onClick={() => handleDelete(id)} title="Delete"><HiOutlineTrash size={18} /></button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper">
      <PageHeader 
        title="Vendor Management" 
        subtitle="Manage your vendors and suppliers"
        actionLabel="Add Vendor"
        actionIcon={HiOutlinePlus}
        onAction={() => { setEditingVendor(null); setIsModalOpen(true); }}
      >
        <Button variant="secondary" icon={HiOutlineDownload} onClick={() => window.print()}>Export</Button>
      </PageHeader>

      <div className="toolbar mb-4">
        <div className="search-box">
          <HiOutlineSearch className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, phone or GST Number..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div style={{ padding: 24 }}><LoadingSkeleton height="40px" count={6} /></div>
        ) : (
          <DataTable 
            columns={columns} 
            data={vendors} 
            emptyMessage="No vendors found. Add your first vendor!" 
          />
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingVendor(null); }} 
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        size="lg"
      >
        <VendorForm 
          vendor={editingVendor} 
          onSubmit={editingVendor ? handleUpdate : handleCreate} 
          onCancel={() => { setIsModalOpen(false); setEditingVendor(null); }}
          loading={submitting}
        />
      </Modal>
    </div>
  );
}
