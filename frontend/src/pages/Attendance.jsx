import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { workSiteApi } from '../api/workSites';
import { HiOutlineCheckCircle, HiOutlineClipboardList } from 'react-icons/hi';
import './Attendance.css';

export default function Attendance() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);

  const fetchSites = useCallback(async () => {
    try {
      const res = await workSiteApi.getAll({ limit: 100 });
      setSites(res.data?.items || []);
    } catch (err) {
      toast.error('Failed to load work sites');
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleSiteChange = async (siteId) => {
    setSelectedSiteId(siteId);
    if (!siteId) {
      setSelectedSite(null);
      setEntries([]);
      setSelectedWorkerIds([]);
      return;
    }

    setLoading(true);
    try {
      const res = await workSiteApi.getById(siteId);
      const siteData = res.data;
      setSelectedSite(siteData);
      
      // Initialize entries for all workers assigned to this site
      const initialEntries = siteData.workers.map(item => ({
        workerId: item.workerId,
        name: item.worker.name,
        role: item.worker.role,
        fullDayRate: item.worker.fullDayRate,
        halfDayRate: item.worker.halfDayRate,
        workType: 'FULL_DAY',
        hours: '',
        rate: item.worker.fullDayRate,
        amount: item.worker.fullDayRate,
        travelAllowance: '',
        foodAllowance: '',
        notes: '',
        present: true // Default to present
      }));
      setEntries(initialEntries);
      setSelectedWorkerIds(initialEntries.map(e => e.workerId));
    } catch (err) {
      toast.error('Failed to load site workers');
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = (workerId, field, value) => {
    setEntries(prev => prev.map(entry => {
      if (entry.workerId !== workerId) return entry;
      
      const newEntry = { ...entry, [field]: value };
      
      // Auto-calculate if needed
      if (field === 'workType' || field === 'present') {
        if (!newEntry.present) {
          newEntry.amount = 0;
          newEntry.rate = 0;
        } else {
          const fullRate = parseFloat(entry.fullDayRate) || 0;
          let calculatedAmount = fullRate;
          
          if (newEntry.workType === 'FULL_DAY') {
            calculatedAmount = fullRate;
          } else if (newEntry.workType === 'HALF_DAY') {
            calculatedAmount = parseFloat(entry.halfDayRate) || (fullRate * 0.5);
          } else if (newEntry.workType === 'ONE_AND_HALF_DAY') {
            calculatedAmount = fullRate * 1.5;
          } else if (newEntry.workType === 'TWO_DAYS') {
            calculatedAmount = fullRate * 2.0;
          }
          
          newEntry.rate = fullRate; // Keep base rate as full day rate for reference
          newEntry.amount = calculatedAmount;
        }
      }
      
      return newEntry;
    }));
  };

  const toggleAll = (present) => {
    setEntries(prev => prev.map(e => {
      const newEntry = { ...e, present };
      if (!present) {
        newEntry.amount = 0;
        newEntry.rate = 0;
      } else {
        newEntry.rate = e.fullDayRate;
        newEntry.amount = e.fullDayRate;
        newEntry.workType = 'FULL_DAY';
      }
      return newEntry;
    }));
  };

  const handleSelectWorker = (workerId) => {
    setSelectedWorkerIds(prev => 
      prev.includes(workerId) ? prev.filter(id => id !== workerId) : [...prev, workerId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedWorkerIds(entries.map(e => e.workerId));
    else setSelectedWorkerIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeEntries = entries.filter(e => selectedWorkerIds.includes(e.workerId) && e.present);
    if (activeEntries.length === 0) return toast.error('No attendance selected to mark');
    
    setSubmitting(true);
    try {
      const payload = activeEntries.map(e => ({
        workerId: e.workerId,
        date,
        workType: e.workType,
        hours: e.hours,
        rate: e.rate,
        amount: e.amount,
        travelAllowance: e.travelAllowance,
        foodAllowance: e.foodAllowance,
        notes: e.notes
      }));
      
      const res = await workSiteApi.addBulkWorkEntries(selectedSiteId, payload);
      const addedCount = res.data.length;
      const skippedCount = payload.length - addedCount;

      if (skippedCount > 0) {
        toast.success(`Marked ${addedCount} entries. Skipped ${skippedCount} duplicates.`);
      } else {
        toast.success('Attendance recorded successfully');
      }

      setEntries([]);
      setSelectedSiteId('');
      setSelectedSite(null);
      setSelectedWorkerIds([]);
    } catch (err) {
      toast.error(err.message || 'Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="attendance-page">
      <PageHeader 
        title="Daily Attendance" 
        subtitle="Mark work progress and allowances for site staff"
        actionIcon={HiOutlineClipboardList}
      />

      <Card className="attendance-filter">
        <div className="filter-grid">
          <Select 
            label="Select Work Site"
            value={selectedSiteId}
            onChange={e => handleSiteChange(e.target.value)}
            options={[{ value: '', label: 'Choose a site...' }, ...sites.map(s => ({ value: s.id, label: s.name }))]}
          />
          <Input 
            label="Date" 
            type="date" 
            value={date} 
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)} 
          />
        </div>
      </Card>

      {loading && <div className="loading-state">Loading assigned workers...</div>}

      {!loading && selectedSite && (
        <form onSubmit={handleSubmit}>
          <div className="table-actions-bar">
            <div className="selection-info">
              {selectedWorkerIds.length} workers selected
            </div>
            <div className="bulk-btns">
              <Button type="button" size="sm" variant="secondary" onClick={() => toggleAll(true)}>Mark All Present</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => toggleAll(false)}>Mark All Absent</Button>
            </div>
          </div>
          <Card className="attendance-list-card" padding={false}>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedWorkerIds.length === entries.length && entries.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Worker</th>
                    <th>Status</th>
                    <th>Work Type</th>
                    <th>Amount (₹)</th>
                    <th>Travel (₹)</th>
                    <th>Food (₹)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.workerId} className={`${!entry.present ? 'row-absent' : ''} ${!selectedWorkerIds.includes(entry.workerId) ? 'row-unselected' : ''}`}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedWorkerIds.includes(entry.workerId)}
                          onChange={() => handleSelectWorker(entry.workerId)}
                        />
                      </td>
                      <td>
                        <div className="worker-info">
                          <span className="worker-name">{entry.name}</span>
                          <span className="worker-role">{entry.role}</span>
                        </div>
                      </td>
                      <td>
                        <div className="status-toggle">
                          <button 
                            type="button"
                            className={`toggle-btn ${entry.present ? 'active' : ''}`}
                            disabled={!selectedWorkerIds.includes(entry.workerId)}
                            onClick={() => updateEntry(entry.workerId, 'present', true)}
                          >
                            P
                          </button>
                          <button 
                            type="button"
                            className={`toggle-btn absent ${!entry.present ? 'active' : ''}`}
                            disabled={!selectedWorkerIds.includes(entry.workerId)}
                            onClick={() => updateEntry(entry.workerId, 'present', false)}
                          >
                            A
                          </button>
                        </div>
                      </td>
                      <td>
                        <select 
                          className="table-select"
                          disabled={!entry.present || !selectedWorkerIds.includes(entry.workerId)}
                          value={entry.workType}
                          onChange={e => updateEntry(entry.workerId, 'workType', e.target.value)}
                        >
                          <option value="FULL_DAY">1 Day</option>
                          <option value="HALF_DAY">Half Day</option>
                          <option value="ONE_AND_HALF_DAY">1.5 Days</option>
                          <option value="TWO_DAYS">2 Days</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="table-input"
                          disabled={!entry.present || !selectedWorkerIds.includes(entry.workerId)}
                          value={entry.amount}
                          onChange={e => updateEntry(entry.workerId, 'amount', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="table-input"
                          disabled={!entry.present || !selectedWorkerIds.includes(entry.workerId)}
                          placeholder="0"
                          value={entry.travelAllowance}
                          onChange={e => updateEntry(entry.workerId, 'travelAllowance', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="table-input"
                          disabled={!entry.present || !selectedWorkerIds.includes(entry.workerId)}
                          placeholder="0"
                          value={entry.foodAllowance}
                          onChange={e => updateEntry(entry.workerId, 'foodAllowance', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="table-input large"
                          disabled={!entry.present || !selectedWorkerIds.includes(entry.workerId)}
                          placeholder="Notes"
                          value={entry.notes}
                          onChange={e => updateEntry(entry.workerId, 'notes', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="form-actions">
            <Button 
              type="submit" 
              size="lg" 
              icon={HiOutlineCheckCircle} 
              loading={submitting}
              fullWidth
            >
              Submit Daily Attendance
            </Button>
          </div>
        </form>
      )}

      {!selectedSite && !loading && (
        <div className="empty-state">
          <HiOutlineClipboardList className="empty-icon" />
          <h3>Select a site to mark attendance</h3>
          <p>Choose a running work site from the dropdown above to start recording daily work entries for assigned staff.</p>
        </div>
      )}
    </div>
  );
}
