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
import { accountApi } from '../api/accounts';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  HiOutlineCurrencyRupee, HiOutlineRefresh, HiOutlineCheckCircle,
  HiOutlinePlusCircle, HiOutlineMinusCircle, HiOutlineChevronDown, HiOutlineChevronRight
} from 'react-icons/hi';
import './Salary.css';

function WorkerSalaryRow({ row, accounts, onPay, onAllowance, onDeduction }) {
  const [open, setOpen] = useState(false);
  const [isSitePayOpen, setIsSitePayOpen] = useState(false);
  const [sitePayData, setSitePayData] = useState({ siteName: '', amount: 0, accountId: accounts[0]?.id || '', notes: '' });
  const [siteSubmitting, setSiteSubmitting] = useState(false);

  // Group work entries by site
  const entriesBySite = {};
  (row.details?.workEntries || []).forEach(e => {
    const siteName = e.workSite?.name || 'Unknown Site';
    if (!entriesBySite[siteName]) entriesBySite[siteName] = [];
    entriesBySite[siteName].push(e);
  });

  const workTypeLabelMap = {
    FULL_DAY: '1 Day', HALF_DAY: 'Half Day',
    ONE_AND_HALF_DAY: '1.5 Days', TWO_DAYS: '2 Days'
  };

  const handleSitePayOpen = (siteName, entries) => {
    const siteTotal = entries.reduce((s, e) => s + e.amount, 0);
    setSitePayData({ siteName, amount: siteTotal, accountId: accounts[0]?.id || '', notes: `Payment for ${siteName}` });
    setIsSitePayOpen(true);
  };

  const handleSiteSettle = async (e) => {
    e.preventDefault();
    setSiteSubmitting(true);
    try {
      await salaryApi.paySalary({
        workerId: row.workerId || row.id,
        amount: sitePayData.amount,
        accountId: sitePayData.accountId,
        notes: sitePayData.notes
      });
      toast.success(`Payment settled for ${sitePayData.siteName}`);
      setIsSitePayOpen(false);
      onPay(null); // trigger refresh via parent's generateSheet
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setSiteSubmitting(false);
    }
  };

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
        <td className="text-right">{formatCurrency(row.totalEarnings)}</td>
        <td className="text-right text-green">+{formatCurrency(row.totalAllowances)}</td>
        <td className="text-right text-red">-{formatCurrency(row.totalDeductions)}</td>
        <td className="text-right text-blue">-{formatCurrency(row.totalPaid)}</td>
        <td className="text-right">
          <span className={`font-bold ${row.netPayable > 0 ? 'text-primary' : ''}`}>
            {formatCurrency(row.netPayable)}
          </span>
        </td>
        <td>
          <div className="action-buttons">
            <button className="action-btn text-green" onClick={() => onAllowance(row)} title="Add Allowance"><HiOutlinePlusCircle /></button>
            <button className="action-btn text-red" onClick={() => onDeduction(row)} title="Add Deduction"><HiOutlineMinusCircle /></button>
            <Button size="sm" disabled={row.netPayable <= 0} onClick={() => onPay(row)} icon={HiOutlineCheckCircle}>Pay</Button>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="salary-detail-row">
          <td colSpan={8} className="detail-cell">
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
                      onPaySite={() => handleSitePayOpen(siteName, entries)}
                    />
                  );
                })
              )}

              {/* Allowances */}
              {(row.details?.allowances || []).length > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-header allowance-header">
                    <span>Allowances</span>
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
                    <span>Deductions</span>
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
                    <span>Payments Made</span>
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

      {/* Site-specific Payment Modal */}
      <Modal isOpen={isSitePayOpen} onClose={() => setIsSitePayOpen(false)} title={`Settle: ${sitePayData.siteName}`}>
        <form onSubmit={handleSiteSettle} className="pay-form">
          <div className="pay-summary">
            <div className="pay-row"><span>Worker:</span><strong>{row.name}</strong></div>
            <div className="pay-row"><span>Site:</span><strong>{sitePayData.siteName}</strong></div>
            <div className="pay-row highlight"><span>Site Earnings:</span><strong>{formatCurrency(sitePayData.amount)}</strong></div>
          </div>
          <Input
            label="Amount (₹) *"
            type="number"
            required
            value={sitePayData.amount}
            onChange={e => setSitePayData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
          />
          <Select
            label="Pay From Account *"
            required
            value={sitePayData.accountId}
            onChange={e => setSitePayData(prev => ({ ...prev, accountId: e.target.value }))}
            options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountName} (₹${acc.currentBalance})` }))}
          />
          <Input
            label="Notes"
            value={sitePayData.notes}
            onChange={e => setSitePayData(prev => ({ ...prev, notes: e.target.value }))}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsSitePayOpen(false)}>Cancel</Button>
            <Button type="submit" loading={siteSubmitting} icon={HiOutlineCheckCircle}>Confirm Settlement</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function SiteSection({ siteName, entries, siteTotal, workTypeLabelMap, onPaySite }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="breakdown-section">
      <div className="breakdown-header site-header">
        <span className="site-header-left" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', flex: 1 }}>
          {open ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
          {siteName}
        </span>
        <span className="site-header-right">
          <span style={{ marginRight: 12 }}>{formatCurrency(siteTotal)}</span>
          <button
            className="site-settle-btn"
            onClick={e => { e.stopPropagation(); onPaySite(); }}
            title={`Settle payment for ${siteName}`}
          >
            <HiOutlineCheckCircle /> Settle
          </button>
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
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [salarySheet, setSalarySheet] = useState([]);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('ALLOWANCE');
  const [selectedWorker, setSelectedWorker] = useState(null);

  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [paymentData, setPaymentData] = useState({ accountId: '', notes: '' });
  const [actionData, setActionData] = useState({ type: '', amount: '', remark: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [workerRes, accRes] = await Promise.all([
        workerApi.getAll({ isActive: 'true' }),
        accountApi.getAll()
      ]);
      setWorkers(workerRes.data?.items || []);
      setAccounts(accRes.data?.items || []);
      if (accRes.data?.items?.length > 0) {
        setPaymentData(prev => ({ ...prev, accountId: accRes.data.items[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load data');
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

  const handlePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await salaryApi.paySalary({
        workerId: selectedWorker.workerId,
        amount: selectedWorker.netPayable,
        accountId: paymentData.accountId,
        notes: paymentData.notes
      });
      toast.success(`Salary paid to ${selectedWorker.name}`);
      setIsPayModalOpen(false);
      generateSheet();
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

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
        title="Payroll Management"
        subtitle="Review earnings by site, adjust allowances/deductions, and settle payments"
        actionLabel="Refresh Data"
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
                  <th>Worker</th>
                  <th className="text-right">Earnings</th>
                  <th className="text-right">Allowances</th>
                  <th className="text-right">Deductions</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salarySheet.map(row => (
                  <WorkerSalaryRow
                    key={row.id}
                    row={row}
                    accounts={accounts}
                    onPay={(r) => { setSelectedWorker(r); setIsPayModalOpen(true); }}
                    onAllowance={(r) => { setActionType('ALLOWANCE'); setSelectedWorker(r); setActionData({ type: 'TRAVEL', amount: '', remark: '', date: new Date().toISOString().split('T')[0] }); setIsActionModalOpen(true); }}
                    onDeduction={(r) => { setActionType('DEDUCTION'); setSelectedWorker(r); setActionData({ type: 'ADVANCE', amount: '', remark: '', date: new Date().toISOString().split('T')[0] }); setIsActionModalOpen(true); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Settle Weekly Payment">
        {selectedWorker && (
          <form onSubmit={handlePayment} className="pay-form">
            <div className="pay-summary">
              <div className="pay-row"><span>Worker:</span> <strong>{selectedWorker.name}</strong></div>
              <div className="pay-row highlight"><span>Net Amount:</span> <strong>{formatCurrency(selectedWorker.netPayable)}</strong></div>
            </div>
            <Select
              label="Pay From Account *"
              required
              value={paymentData.accountId}
              onChange={e => setPaymentData({ ...paymentData, accountId: e.target.value })}
              options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountName} (₹${acc.currentBalance})` }))}
            />
            <Input label="Notes" value={paymentData.notes} onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })} />
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Mark as Settled</Button>
            </div>
          </form>
        )}
      </Modal>

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
