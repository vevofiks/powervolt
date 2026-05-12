import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { workerApi } from '../api/workers';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineSearch, HiOutlineEye, HiOutlineCalendar } from 'react-icons/hi';
import './Workers.css';

export default function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Helper',
    fullDayRate: '',
    halfDayRate: '',
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.getAll({ search: searchQuery });
      setWorkers(res.data?.items || []);
    } catch (err) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      role: worker.role || 'Helper',
      fullDayRate: worker.fullDayRate,
      halfDayRate: worker.halfDayRate,
      joinDate: new Date(worker.joinDate).toISOString().split('T')[0],
      isActive: worker.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingWorker) {
        await workerApi.update(editingWorker.id, formData);
        toast.success('Worker updated');
      } else {
        await workerApi.create(formData);
        toast.success('Worker registered successfully');
      }
      setIsModalOpen(false);
      setEditingWorker(null);
      resetForm();
      fetchWorkers();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', phone: '', role: 'Helper', fullDayRate: '', halfDayRate: '',
      joinDate: new Date().toISOString().split('T')[0], isActive: true
    });
  };

  const columns = [
    { key: 'name', label: 'Name & Role', render: (val, row) => (
      <div className="worker-info">
        <span className="font-semibold">{val}</span>
        <span className="text-xs text-muted">{row.role}</span>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (val) => val || '—' },
    { key: 'fullDayRate', label: 'Full/Half Day', render: (val, row) => (
      <span className="rate-text">{formatCurrency(val)} / {formatCurrency(row.halfDayRate)}</span>
    )},
    { key: 'isActive', label: 'Status', render: (val) => (
      <Badge variant={val ? 'success' : 'danger'}>{val ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'joinDate', label: 'Joined', render: (val) => formatDate(val) },
    { key: 'id', label: 'Actions', render: (_, row) => (
      <div className="action-buttons">
        <button className="action-btn primary" onClick={() => navigate(`/admin/workers/${row.id}`)} title="View Ledger"><HiOutlineEye /></button>
        <button className="action-btn" onClick={() => handleEdit(row)} title="Edit"><HiOutlinePencil /></button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper workers-page">
      <PageHeader 
        title="Worker Management" 
        subtitle="Manage workers, assignment rates, and earning history"
        actionLabel="Register Worker"
        actionIcon={HiOutlinePlus}
        onAction={() => { setEditingWorker(null); resetForm(); setIsModalOpen(true); }}
      />

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Button variant="secondary" icon={HiOutlineCalendar} onClick={() => navigate('/admin/salary')}>
          Salary Sheet
        </Button>
      </div>

      <Card padding={false}>
        <DataTable 
          columns={columns} 
          data={workers} 
          loading={loading}
          emptyMessage="No workers registered."
        />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingWorker ? 'Edit Worker Profile' : 'Register New Worker'}
      >
        <form onSubmit={handleSubmit} className="worker-form">
          <Input 
            label="Full Name *" 
            required 
            placeholder="e.g., Ramesh Kumar"
            value={formData.name} 
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          <div className="form-row">
            <Input 
              label="Phone Number" 
              placeholder="10-digit mobile"
              value={formData.phone} 
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Select 
              label="Worker Type *" 
              required
              options={[
                { value: 'Main Worker', label: 'Main Worker' },
                { value: 'Helper', label: 'Helper' }
              ]}
              value={formData.role} 
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <Input 
              label="Full Day Rate (₹) *" 
              type="number"
              required
              placeholder="0.00"
              value={formData.fullDayRate} 
              onChange={(e) => setFormData(prev => ({ ...prev, fullDayRate: e.target.value }))}
            />
            <Input 
              label="Half Day Rate (₹) *" 
              type="number"
              required
              placeholder="0.00"
              value={formData.halfDayRate} 
              onChange={(e) => setFormData(prev => ({ ...prev, halfDayRate: e.target.value }))}
            />
          </div>
          <Input 
            label="Joining Date" 
            type="date"
            value={formData.joinDate} 
            onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingWorker ? 'Update Profile' : 'Register Worker'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
