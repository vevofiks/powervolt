import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { workSiteApi } from '../api/workSites';
import { customerApi } from '../api/customers';
import { workerApi } from '../api/workers';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineSearch, HiOutlineEye, HiOutlineUserAdd, HiOutlineUsers } from 'react-icons/hi';
import './WorkSites.css';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' }
];

export default function WorkSites() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSite, setEditingSite] = useState(null);

  const [formData, setFormData] = useState({
    name: '', customerId: '', customerName: '', customerPhone: '', 
    location: '', startDate: '', endDate: '', status: 'PENDING', 
    budget: '', notes: ''
  });

  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isViewWorkersOpen, setIsViewWorkersOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [allWorkers, setAllWorkers] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [siteWorkers, setSiteWorkers] = useState([]);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const [sitesRes, customersRes, workersRes] = await Promise.all([
        workSiteApi.getAll({ search: searchQuery }),
        customerApi.getAll({ limit: 100 }),
        workerApi.getAll({ limit: 100 })
      ]);
      setSites(sitesRes.data?.items || []);
      setCustomers(customersRes.data?.items || []);
      setAllWorkers(workersRes.data?.items || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleEdit = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      customerId: site.customerId || '',
      customerName: site.customer?.name || '',
      customerPhone: site.customer?.phone || '',
      location: site.location || '',
      startDate: site.startDate ? new Date(site.startDate).toISOString().split('T')[0] : '',
      endDate: site.endDate ? new Date(site.endDate).toISOString().split('T')[0] : '',
      status: site.status,
      budget: site.budget,
      notes: site.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSite) {
        await workSiteApi.update(editingSite.id, formData);
        toast.success('Work site updated');
      } else {
        await workSiteApi.create(formData);
        toast.success('Work site created');
      }
      setIsModalOpen(false);
      setEditingSite(null);
      resetForm();
      fetchSites();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignWorkers = async () => {
    if (selectedWorkerIds.length === 0) return toast.error('Select at least one worker');
    setSubmitting(true);
    try {
      await workSiteApi.assignWorkers(selectedSite.id, selectedWorkerIds);
      toast.success('Workers assigned successfully');
      setIsWorkerModalOpen(false);
      setSelectedWorkerIds([]);
      fetchSites();
    } catch (err) {
      toast.error('Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openManageWorkers = async (site) => {
    setSelectedSite(site);
    setLoading(true);
    try {
      const res = await workSiteApi.getById(site.id);
      const assignedIds = res.data.workers.map(w => w.workerId);
      setSelectedWorkerIds(assignedIds);
      setIsWorkerModalOpen(true);
    } catch (err) {
      toast.error('Failed to load site workers');
    } finally {
      setLoading(false);
    }
  };

  const openViewWorkers = async (site) => {
    setSelectedSite(site);
    setLoading(true);
    try {
      const res = await workSiteApi.getById(site.id);
      setSiteWorkers(res.data.workers || []);
      setIsViewWorkersOpen(true);
    } catch (err) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', customerId: '', customerName: '', customerPhone: '', 
      location: '', startDate: '', endDate: '', status: 'PENDING', 
      budget: '', notes: ''
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
      case 'RUNNING': return <Badge variant="primary">Running</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    { key: 'name', label: 'Site & Client', render: (val, row) => (
      <div className="site-info-cell">
        <span className="font-semibold">{val}</span>
        <span className="text-xs text-muted">{row.customer?.name || 'Walk-in Client'}</span>
      </div>
    )},
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: (val) => getStatusBadge(val) },
    { key: 'budget', label: 'Budget', align: 'right', render: (val) => formatCurrency(val) },
    { key: '_count', label: 'Workers', render: (val, row) => (
      <button className="site-workers-count" onClick={() => openViewWorkers(row)} title="Click to view workers">
        <HiOutlineUsers className="mr-1" />
        {val?.workers || 0} Staff
      </button>
    )},
    { key: 'id', label: 'Actions', render: (_, row) => (
      <div className="action-buttons">
        <button className="action-btn primary" onClick={() => navigate(`/admin/work-sites/${row.id}`)} title="View Details"><HiOutlineEye /></button>
        <button className="action-btn text-blue" onClick={() => openManageWorkers(row)} title="Assign Staff"><HiOutlineUserAdd /></button>
        <button className="action-btn" onClick={() => handleEdit(row)} title="Edit"><HiOutlinePencil /></button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper work-sites-page">
      <PageHeader 
        title="Project Management" 
        subtitle="Track site progress, budgets, and worker costs"
        actionLabel="Add New Site"
        actionIcon={HiOutlinePlus}
        onAction={() => { setEditingSite(null); resetForm(); setIsModalOpen(true); }}
      />

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search sites, clients, or locations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card padding={false}>
        <DataTable 
          columns={columns} 
          data={sites} 
          loading={loading}
          emptyMessage="No project sites found."
        />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSite ? 'Edit Project Details' : 'Register New Project Site'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="site-form">
          <div className="form-row">
            <Input 
              label="Site Name *" 
              required 
              placeholder="e.g., Luxury Villa #4"
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <div className="customer-suggest">
              <Input 
                label="Customer Name *" 
                required
                placeholder="Type to suggest or add new"
                value={formData.customerName} 
                onChange={(e) => {
                  const val = e.target.value;
                  const existing = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
                  setFormData(prev => ({ 
                    ...prev, 
                    customerName: val,
                    customerId: existing ? existing.id : '',
                    customerPhone: existing ? existing.phone : prev.customerPhone
                  }));
                }}
                list="customer-list"
              />
              <datalist id="customer-list">
                {customers.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
          </div>
          <div className="form-row">
            <Input 
              label="Location" 
              placeholder="Detailed address"
              value={formData.location} 
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
            <Input 
              label="Customer Phone" 
              placeholder="Contact number"
              value={formData.customerPhone} 
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <Input 
              label="Start Date" 
              type="date"
              value={formData.startDate} 
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <Input 
              label="Estimated End Date" 
              type="date"
              value={formData.endDate} 
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <Select 
              label="Current Status" 
              value={formData.status} 
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              options={STATUS_OPTIONS}
            />
            <Input 
              label="Budgeted Amount (₹)" 
              type="number"
              placeholder="0.00"
              value={formData.budget} 
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            />
          </div>
          <Input 
            label="Notes" 
            placeholder="Special instructions..."
            value={formData.notes} 
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingSite ? 'Save Changes' : 'Create Project'}</Button>
          </div>
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal isOpen={isWorkerModalOpen} onClose={() => setIsWorkerModalOpen(false)} title={`Assign Staff to ${selectedSite?.name}`}>
        <div className="worker-selection-list">
          {allWorkers.map(w => (
            <label key={w.id} className="worker-check-item">
              <input 
                type="checkbox" 
                checked={selectedWorkerIds.includes(w.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedWorkerIds([...selectedWorkerIds, w.id]);
                  else setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== w.id));
                }}
              />
              <span>{w.name} ({w.role})</span>
            </label>
          ))}
          {allWorkers.length === 0 && <p className="text-center p-4 text-muted">No workers found in database.</p>}
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setIsWorkerModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignWorkers} loading={submitting}>Save Assignments</Button>
        </div>
      </Modal>

      {/* View Workers Modal */}
      <Modal isOpen={isViewWorkersOpen} onClose={() => setIsViewWorkersOpen(false)} title={`Staff at ${selectedSite?.name}`}>
        <div className="view-workers-list">
          {siteWorkers.length === 0 ? (
            <p className="empty-text">No staff assigned to this site.</p>
          ) : (
            siteWorkers.map(item => (
              <div key={item.id} className="view-worker-item">
                <div className="worker-avatar">{item.worker.name.charAt(0)}</div>
                <div className="worker-info">
                  <span className="worker-name">{item.worker.name}</span>
                  <span className="worker-role">{item.worker.role}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="modal-actions">
          <Button onClick={() => setIsViewWorkersOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}
