import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
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
import { HiOutlineCurrencyRupee, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlinePlusCircle, HiOutlineMinusCircle } from 'react-icons/hi';
import './Salary.css';

export default function Salary() {
  const [workers, setWorkers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [salarySheet, setSalarySheet] = useState([]);
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('ALLOWANCE'); // ALLOWANCE or DEDUCTION
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (workers.length > 0) generateSheet();
  }, [workers, generateSheet]);

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

  const columns = [
    { key: 'name', label: 'Worker', render: (val, row) => (
      <div className="worker-cell">
        <span className="font-semibold">{val}</span>
        <span className="text-xs text-muted">{row.role}</span>
      </div>
    )},
    { key: 'totalEarnings', label: 'Earnings', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'totalAllowances', label: 'Allowances', align: 'right', render: (val) => <span className="text-green">+{formatCurrency(val)}</span> },
    { key: 'totalDeductions', label: 'Deductions', align: 'right', render: (val) => <span className="text-red">-{formatCurrency(val)}</span> },
    { key: 'netPayable', label: 'Net Payable', align: 'right', render: (val) => <span className="font-bold">{formatCurrency(val)}</span> },
    { key: 'id', label: 'Actions', align: 'right', render: (_, row) => (
      <div className="action-buttons">
        <button className="action-btn text-green" onClick={() => { setActionType('ALLOWANCE'); setSelectedWorker(row); setActionData({ type: 'TRAVEL', amount: '', remark: '', date: new Date().toISOString().split('T')[0] }); setIsActionModalOpen(true); }} title="Add Allowance"><HiOutlinePlusCircle /></button>
        <button className="action-btn text-red" onClick={() => { setActionType('DEDUCTION'); setSelectedWorker(row); setActionData({ type: 'ADVANCE', amount: '', remark: '', date: new Date().toISOString().split('T')[0] }); setIsActionModalOpen(true); }} title="Add Deduction"><HiOutlineMinusCircle /></button>
        <Button size="sm" disabled={row.netPayable <= 0} onClick={() => { setSelectedWorker(row); setIsPayModalOpen(true); }} icon={HiOutlineCheckCircle}>Pay</Button>
      </div>
    )},
  ];

  return (
    <div className="page-wrapper salary-page">
      <PageHeader 
        title="Payroll Management" 
        subtitle="Review earnings, adjust allowances/deductions, and process payments"
        actionLabel="Refresh Data"
        actionIcon={HiOutlineRefresh}
        onAction={generateSheet}
      />

      <div className="toolbar">
        <Card>
          <div className="filter-row">
            <Input label="From" type="date" value={period.startDate} onChange={e => setPeriod({...period, startDate: e.target.value})} />
            <Input label="To" type="date" value={period.endDate} onChange={e => setPeriod({...period, endDate: e.target.value})} />
            <Button variant="secondary" onClick={generateSheet} style={{ alignSelf: 'flex-end' }}>Calculate Sheet</Button>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={salarySheet} loading={loading} emptyMessage="No payroll data for this period." />
      </Card>

      {/* Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Process Salary Payment">
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
              onChange={e => setPaymentData({...paymentData, accountId: e.target.value})}
              options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountName} (₹${acc.currentBalance})` }))}
            />
            <Input label="Notes" value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} />
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Confirm Payment</Button>
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
              onChange={e => setActionData({...actionData, type: e.target.value})}
              options={actionType === 'ALLOWANCE' 
                ? [{ value: 'TRAVEL', label: 'Travel' }, { value: 'FOOD', label: 'Food' }, { value: 'BONUS', label: 'Bonus' }, { value: 'OTHER', label: 'Other' }]
                : [{ value: 'ADVANCE', label: 'Advance' }, { value: 'PENALTY', label: 'Penalty' }, { value: 'TOOL_RENT', label: 'Tool Rent' }, { value: 'LOAN', label: 'Loan Recovery' }]
              }
            />
            <Input label="Amount (₹) *" type="number" required value={actionData.amount} onChange={e => setActionData({...actionData, amount: e.target.value})} />
            <Input label="Date" type="date" value={actionData.date} onChange={e => setActionData({...actionData, date: e.target.value})} />
            <Input label="Remark" value={actionData.remark} onChange={e => setActionData({...actionData, remark: e.target.value})} />
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
