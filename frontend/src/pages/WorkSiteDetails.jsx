import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { workerApi } from '../api/workers';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlineArrowLeft, HiOutlineUserAdd, HiOutlineClipboardList, HiOutlineCurrencyRupee, HiOutlineTrash, HiOutlineChartPie } from 'react-icons/hi';
import './WorkSiteDetails.css';

export default function WorkSiteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allWorkers, setAllWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [entryData, setEntryData] = useState({ 
    workerId: '', 
    date: new Date().toISOString().split('T')[0], 
    workType: 'FULL_DAY',
    hours: '',
    rate: '',
    amount: '',
    travelAllowance: '',
    foodAllowance: '',
    notes: '' 
  });
  
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);

  const fetchDetails = useCallback(async () => {
    try {
      const [siteRes, workersRes] = await Promise.all([
        workSiteApi.getById(id),
        workerApi.getAll({ limit: 100 })
      ]);
      setSite(siteRes.data);
      setAllWorkers(workersRes.data?.items || []);
    } catch (err) {
      toast.error('Failed to load site details');
      navigate('/admin/work-sites');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Auto-calculate amount when workType or worker changes
  useEffect(() => {
    if (entryData.workerId) {
      const worker = allWorkers.find(w => w.id === entryData.workerId);
      if (worker) {
        let rate = entryData.rate;
        if (entryData.workType === 'FULL_DAY') rate = worker.fullDayRate;
        else if (entryData.workType === 'HALF_DAY') rate = worker.halfDayRate;
        
        let amount = rate;
        if (entryData.workType === 'OVERTIME' && entryData.hours) {
          amount = (parseFloat(rate) || 0) * (parseFloat(entryData.hours) || 0);
        }

        setEntryData(prev => ({ ...prev, rate: rate, amount: amount }));
      }
    }
  }, [entryData.workerId, entryData.workType, entryData.hours, allWorkers]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryData.workerId || !entryData.amount) return toast.error('Fill all required fields');
    setSubmitting(true);
    try {
      await workSiteApi.addWorkEntry(id, entryData);
      toast.success('Work entry and allowances added');
      setIsEntryModalOpen(false);
      setEntryData({ 
        workerId: '', 
        date: new Date().toISOString().split('T')[0], 
        workType: 'FULL_DAY', 
        hours: '', 
        rate: '', 
        amount: '', 
        travelAllowance: '',
        foodAllowance: '',
        notes: '' 
      });
      fetchDetails();
    } catch (err) {
      toast.error('Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignWorkers = async () => {
    if (selectedWorkerIds.length === 0) return toast.error('Select at least one worker');
    setSubmitting(true);
    try {
      await workSiteApi.assignWorkers(id, selectedWorkerIds);
      toast.success('Workers assigned');
      setIsWorkerModalOpen(false);
      setSelectedWorkerIds([]);
      fetchDetails();
    } catch (err) {
      toast.error('Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveWorker = async (workerId) => {
    if (!window.confirm('Remove worker from this site?')) return;
    try {
      await workSiteApi.removeWorker(id, workerId);
      toast.success('Worker removed');
      fetchDetails();
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <div className="page-wrapper">Loading site details...</div>;
  if (!site) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineChartPie },
    { id: 'workers', label: 'Workers', icon: HiOutlineUserAdd },
    { id: 'entries', label: 'Work Entries', icon: HiOutlineClipboardList },
    { id: 'expenses', label: 'Expenses', icon: HiOutlineCurrencyRupee }
  ];

  return (
    <div className="site-details-page">
      <PageHeader 
        title={site.name} 
        subtitle={`Client: ${site.customer?.name || 'Walk-in'} | Location: ${site.location || 'N/A'}`}
        actionLabel="Back to Sites"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/work-sites')}
      />

      <div className="tabs-navigation">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-row">
              <Card title="Project Cost" className="stat-card primary">
                <div className="stat-val">{formatCurrency(site.stats.totalSiteCost)}</div>
                <div className="stat-label">Total investment so far</div>
              </Card>
              <Card title="Labor Cost" className="stat-card">
                <div className="stat-val">{formatCurrency(site.stats.totalLaborCost)}</div>
                <div className="stat-label">Earnings by workers</div>
              </Card>
              <Card title="Material/Expenses" className="stat-card">
                <div className="stat-val">{formatCurrency(site.stats.totalExpenses)}</div>
                <div className="stat-label">Other site expenditures</div>
              </Card>
            </div>
            
            <Card title="Project Info" style={{ marginTop: '24px' }}>
              <div className="info-grid">
                <div className="info-item"><label>Start Date</label><span>{formatDate(site.startDate)}</span></div>
                <div className="info-item"><label>Budget Utilization</label><span>{site.budget > 0 ? ((site.stats.totalSiteCost / site.budget) * 100).toFixed(1) + '%' : 'N/A'}</span></div>
                <div className="info-item"><label>Status</label><Badge variant="primary">{site.status}</Badge></div>
                <div className="info-item"><label>Notes</label><span>{site.notes || '—'}</span></div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="workers-tab">
            <div className="tab-actions">
              <Button icon={HiOutlineUserAdd} onClick={() => setIsWorkerModalOpen(true)}>Assign Workers</Button>
            </div>
            <Card padding={false}>
              <div className="workers-grid">
                {site.workers.length === 0 ? (
                  <p className="empty-text">No workers assigned to this site yet.</p>
                ) : (
                  site.workers.map(item => (
                    <div key={item.id} className="worker-assignment-card">
                      <div className="worker-avatar">{item.worker.name.charAt(0)}</div>
                      <div className="worker-main">
                        <span className="worker-name">{item.worker.name}</span>
                        <span className="worker-role">{item.worker.role}</span>
                      </div>
                      <button className="remove-worker-btn" onClick={() => handleRemoveWorker(item.workerId)}><HiOutlineTrash /></button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="entries-tab">
            <div className="tab-actions">
              <Button icon={HiOutlinePlus} onClick={() => setIsEntryModalOpen(true)}>Add Daily Entry</Button>
            </div>
            <Card padding={false}>
              <DataTable 
                columns={[
                  { key: 'date', label: 'Date', render: (val) => formatDate(val) },
                  { key: 'worker', label: 'Worker', render: (val) => val?.name },
                  { key: 'workType', label: 'Status', render: (val) => {
                    if (val === 'FULL_DAY') return <Badge variant="success">Present</Badge>;
                    if (val === 'HALF_DAY') return <Badge variant="warning">Half Day</Badge>;
                    if (val === 'OVERTIME') return <Badge variant="primary">Overtime</Badge>;
                    return <Badge>{val}</Badge>;
                  }},
                  { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
                  { key: 'notes', label: 'Remarks', render: (val) => val || '—' }
                ]}
                data={site.workEntries}
              />
            </Card>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-tab">
            <Card padding={false}>
              <DataTable 
                columns={[
                  { key: 'date', label: 'Date', render: (val) => formatDate(val) },
                  { key: 'title', label: 'Title' },
                  { key: 'category', label: 'Category' },
                  { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) }
                ]}
                data={site.expenses}
              />
            </Card>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <Modal isOpen={isWorkerModalOpen} onClose={() => setIsWorkerModalOpen(false)} title="Assign Workers to Site">
        <div className="worker-selection-list">
          {allWorkers.filter(w => !site.workers.some(sw => sw.workerId === w.id)).map(w => (
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
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setIsWorkerModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignWorkers} loading={submitting}>Assign Selected</Button>
        </div>
      </Modal>

      {/* Work Entry Modal */}
      <Modal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} title="Daily Work Entry" size="lg">
        <form onSubmit={handleAddEntry} className="entry-form">
          <div className="form-row">
            <Select 
              label="Select Worker *" 
              required
              options={site.workers.map(item => ({ value: item.workerId, label: item.worker.name }))}
              value={entryData.workerId}
              onChange={e => setEntryData({...entryData, workerId: e.target.value})}
            />
            <Input label="Date" type="date" required value={entryData.date} max={new Date().toISOString().split('T')[0]} onChange={e => setEntryData({...entryData, date: e.target.value})} />
          </div>
          <div className="form-row">
            <Select 
              label="Work Type *" 
              required
              options={[
                { value: 'FULL_DAY', label: 'Full Day' },
                { value: 'HALF_DAY', label: 'Half Day' },
                { value: 'OVERTIME', label: 'Overtime (Hourly)' }
              ]}
              value={entryData.workType}
              onChange={e => setEntryData({...entryData, workType: e.target.value})}
            />
            {entryData.workType === 'OVERTIME' && (
              <Input label="Hours" type="number" placeholder="e.g. 2" value={entryData.hours} onChange={e => setEntryData({...entryData, hours: e.target.value})} />
            )}
          </div>
          <div className="form-row">
            <Input label="Calculated Rate (₹)" type="number" value={entryData.rate} readOnly />
            <Input label="Total Amount (₹)" type="number" required value={entryData.amount} onChange={e => setEntryData({...entryData, amount: e.target.value})} />
          </div>
          <div className="form-row">
            <Input label="Travel Allowance (₹)" type="number" placeholder="0" value={entryData.travelAllowance} onChange={e => setEntryData({...entryData, travelAllowance: e.target.value})} />
            <Input label="Food Allowance (₹)" type="number" placeholder="0" value={entryData.foodAllowance} onChange={e => setEntryData({...entryData, foodAllowance: e.target.value})} />
          </div>
          <Input label="Remarks" placeholder="Optional notes" value={entryData.notes} onChange={e => setEntryData({...entryData, notes: e.target.value})} />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsEntryModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
