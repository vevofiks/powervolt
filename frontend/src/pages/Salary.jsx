import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { workerApi } from '../api/workers';
import { salaryApi } from '../api/salary';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  HiOutlineRefresh,
  HiOutlinePlusCircle, HiOutlineMinusCircle, HiOutlineChevronDown, HiOutlineChevronRight
} from 'react-icons/hi';
import './Salary.css';

function WorkerSalaryRow({ row, onAllowance, onDeduction }) {
  const [open, setOpen] = useState(false);

  // Group work entries by site
  const entriesBySite = {};
  (row.details?.workEntries || []).forEach(e => {
    const siteName = e.workSite?.name || 'Unknown Site';
    if (!entriesBySite[siteName]) entriesBySite[siteName] = [];
    entriesBySite[siteName].push(e);
  });

  const workTypeLabelMap = {
    FULL_DAY: '1 Day',
    HALF_DAY: 'Half Day',
    ONE_AND_HALF_DAY: '1.5 Days',
    TWO_DAYS: '2 Days'
  };

  const workedDays = row.details?.workEntries?.length || 0;
  const grossEarnings = row.totalEarnings || 0;
  const allowances = row.totalAllowances || 0;
  const deductions = row.totalDeductions || 0;
  const netSalaryPayable = grossEarnings + allowances - deductions;
  const totalPaid = row.totalPaid || 0;
  const pendingSalary = Math.max(0, netSalaryPayable - totalPaid);

  let status = 'Unpaid';
  let statusVariant = 'danger';
  if (totalPaid > 0) {
    if (pendingSalary <= 0) {
      status = 'Fully Paid';
      statusVariant = 'success';
    } else {
      status = 'Partially Paid';
      statusVariant = 'warning';
    }
  } else if (netSalaryPayable <= 0) {
    status = 'Fully Paid';
    statusVariant = 'success';
  }

  return (
    <>
      <tr className={`salary-main-row ${open ? 'expanded' : ''}`}>
        <td>
          <button className="expand-btn" onClick={() => setOpen(o => !o)}>
            {open ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
          </button>
        </td>
        <td>
          <div className="worker-cell">
            <span className="font-semibold">{row.name}</span>
            <span className="text-xs text-muted">{row.role}</span>
          </div>
        </td>
        <td className="text-center font-medium">{workedDays}</td>
        <td className="text-right">{formatCurrency(grossEarnings)}</td>
        <td className="text-right text-green">+{formatCurrency(allowances)}</td>
        <td className="text-right text-red">-{formatCurrency(deductions)}</td>
        <td className="text-right font-semibold">{formatCurrency(netSalaryPayable)}</td>
        <td className="text-right text-blue">{formatCurrency(totalPaid)}</td>
        <td className="text-right font-bold text-primary">{formatCurrency(pendingSalary)}</td>
        <td className="text-center">
          <Badge variant={statusVariant}>{status}</Badge>
        </td>
        <td>
          <div className="action-buttons">
            <button className="action-btn text-green" onClick={() => onAllowance(row)} title="Add Allowance"><HiOutlinePlusCircle /></button>
            <button className="action-btn text-red" onClick={() => onDeduction(row)} title="Add Deduction"><HiOutlineMinusCircle /></button>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="salary-detail-row">
          <td colSpan={11} className="detail-cell">
            <div className="site-breakdown">
              {Object.keys(entriesBySite).length === 0 ? (
                <p className="no-entries">No work entries in this period.</p>
              ) : (
                Object.entries(entriesBySite).map(([siteName, entries]) => {
                  const siteTotal = entries.reduce((s, e) => s + e.amount, 0);
                  return (
                    <SiteSection
                      key={siteName}
                      siteName={siteName}
                      entries={entries}
                      siteTotal={siteTotal}
                      workTypeLabelMap={workTypeLabelMap}
                    />
                  );
                })
              )}

              {/* Allowances */}
              {(row.details?.allowances || []).length > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-header allowance-header">
                    <span>Allowances Details</span>
                    <span>+{formatCurrency(row.totalAllowances)}</span>
                  </div>
                  <table className="breakdown-table">
                    <thead><tr><th>Date</th><th>Type</th><th>Remark</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>
                      {row.details.allowances.map((a, i) => (
                        <tr key={i}>
                          <td>{formatDate(a.date)}</td>
                          <td>{a.type}</td>
                          <td>{a.remark || '—'}</td>
                          <td className="text-right text-green">{formatCurrency(a.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Deductions */}
              {(row.details?.deductions || []).length > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-header deduction-header">
                    <span>Deductions Details</span>
                    <span>-{formatCurrency(row.totalDeductions)}</span>
                  </div>
                  <table className="breakdown-table">
                    <thead><tr><th>Date</th><th>Type</th><th>Remark</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>
                      {row.details.deductions.map((d, i) => (
                        <tr key={i}>
                          <td>{formatDate(d.date)}</td>
                          <td>{d.type}</td>
                          <td>{d.remark || '—'}</td>
                          <td className="text-right text-red">{formatCurrency(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payments */}
              {(row.details?.payments || []).length > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-header payment-header">
                    <span>Salary Payments History</span>
                    <span>-{formatCurrency(row.totalPaid)}</span>
                  </div>
                  <table className="breakdown-table">
                    <thead><tr><th>Date</th><th>Notes</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>
                      {row.details.payments.map((p, i) => (
                        <tr key={i}>
                          <td>{formatDate(p.date)}</td>
                          <td>{p.notes || '—'}</td>
                          <td className="text-right text-blue">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SiteSection({ siteName, entries, siteTotal, workTypeLabelMap }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="breakdown-section">
      <div className="breakdown-header site-header">
        <span className="site-header-left" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', flex: 1 }}>
          {open ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
          {siteName}
        </span>
        <span className="site-header-right">
          <span>{formatCurrency(siteTotal)}</span>
        </span>
      </div>
      {open && (
        <table className="breakdown-table">
          <thead>
            <tr><th>Date</th><th>Work Type</th><th>Notes</th><th className="text-right">Amount</th></tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td>{formatDate(e.date)}</td>
                <td><Badge variant="success">{workTypeLabelMap[e.workType] || e.workType}</Badge></td>
                <td>{e.notes || '—'}</td>
                <td className="text-right">{formatCurrency(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Salary() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [salarySheet, setSalarySheet] = useState([]);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('ALLOWANCE');
  const [selectedWorker, setSelectedWorker] = useState(null);

  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [actionData, setActionData] = useState({ type: '', amount: '', remark: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const workerRes = await workerApi.getAll({ isActive: 'true' });
      setWorkers(workerRes.data?.items || []);
    } catch (err) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSheet = useCallback(async () => {
    if (workers.length === 0) return;
    setLoading(true);
    try {
      const sheet = await Promise.all(
        workers.map(async (w) => {
          const res = await salaryApi.getDraft({
            workerId: w.id,
            startDate: period.startDate,
            endDate: period.endDate
          });
          return { ...w, ...res.data };
        })
      );
      setSalarySheet(sheet);
    } catch (err) {
      toast.error('Failed to calculate salary sheet');
    } finally {
      setLoading(false);
    }
  }, [workers, period]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (workers.length > 0) generateSheet(); }, [workers, generateSheet]);

  const handleAction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...actionData, workerId: selectedWorker.id || selectedWorker.workerId };
      if (actionType === 'ALLOWANCE') await salaryApi.addAllowance(payload);
      else await salaryApi.addDeduction(payload);
      toast.success(`${actionType} added successfully`);
      setIsActionModalOpen(false);
      generateSheet();
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper salary-page">
      <PageHeader
        title="Payroll Calculation"
        subtitle="Review earnings, allowances, deductions, and track pending salaries"
        actionLabel="Refresh Calculations"
        actionIcon={HiOutlineRefresh}
        onAction={generateSheet}
      />

      <div className="toolbar">
        <Card>
          <div className="filter-row">
            <Input label="From" type="date" value={period.startDate} max={new Date().toISOString().split('T')[0]} onChange={e => setPeriod({ ...period, startDate: e.target.value })} />
            <Input label="To" type="date" value={period.endDate} max={new Date().toISOString().split('T')[0]} onChange={e => setPeriod({ ...period, endDate: e.target.value })} />
            <Button variant="secondary" onClick={generateSheet} style={{ alignSelf: 'flex-end' }}>Calculate Sheet</Button>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payroll data...</div>
        ) : salarySheet.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No payroll data for this period.</div>
        ) : (
          <div className="salary-table-wrapper">
            <table className="salary-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>Worker Name</th>
                  <th className="text-center">Worked Days</th>
                  <th className="text-right">Gross Earnings</th>
                  <th className="text-right">Allowances</th>
                  <th className="text-right">Deductions</th>
                  <th className="text-right">Net Payable</th>
                  <th className="text-right">Total Paid</th>
                  <th className="text-right">Pending Salary</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salarySheet.map(row => (
                  <WorkerSalaryRow
                    key={row.id}
                    row={row}
                    onAllowance={(r) => { setActionType('ALLOWANCE'); setSelectedWorker(r); setActionData({ type: 'TRAVEL', amount: '', remark: '', date: new Date().toISOString().split('T')[0] }); setIsActionModalOpen(true); }}
                    onDeduction={(r) => { setActionType('DEDUCTION'); setSelectedWorker(r); setActionData({ type: 'ADVANCE', amount: '', remark: '', date: new Date().toISOString().split('T')[0] }); setIsActionModalOpen(true); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Allowance/Deduction Modal */}
      <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title={`Add ${actionType}`}>
        {selectedWorker && (
          <form onSubmit={handleAction} className="action-form">
            <Select
              label="Type *"
              required
              value={actionData.type}
              onChange={e => setActionData({ ...actionData, type: e.target.value })}
              options={actionType === 'ALLOWANCE'
                ? [{ value: 'TRAVEL', label: 'Travel' }, { value: 'FOOD', label: 'Food' }, { value: 'BONUS', label: 'Bonus' }, { value: 'OTHER', label: 'Other' }]
                : [{ value: 'ADVANCE', label: 'Advance' }, { value: 'PENALTY', label: 'Penalty' }, { value: 'TOOL_RENT', label: 'Tool Rent' }, { value: 'LOAN', label: 'Loan Recovery' }]
              }
            />
            <Input label="Amount (₹) *" type="number" required value={actionData.amount} onChange={e => setActionData({ ...actionData, amount: e.target.value })} />
            <Input label="Date" type="date" value={actionData.date} max={new Date().toISOString().split('T')[0]} onChange={e => setActionData({ ...actionData, date: e.target.value })} />
            <Input label="Remark" value={actionData.remark} onChange={e => setActionData({ ...actionData, remark: e.target.value })} />
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save {actionType}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
