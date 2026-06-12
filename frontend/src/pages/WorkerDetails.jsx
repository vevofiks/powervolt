import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { salaryApi } from '../api/salary';
import { workerApi } from '../api/workers';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';
import './WorkerDetails.css';

export default function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [workerRes, ledgerRes] = await Promise.all([
        workerApi.getById(id),
        salaryApi.getLedger(id)
      ]);
      setWorker(workerRes.data);
      setLedger(ledgerRes.data);
    } catch (err) {
      toast.error('Failed to load worker details');
      navigate('/admin/workers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return <div className="page-wrapper">Loading worker history...</div>;
  if (!worker || !ledger) return null;

  // Calculate stats breakdown
  const workEntriesSum = ledger.history.filter(h => h.category === 'Site Work').reduce((sum, h) => sum + h.amount, 0);
  const allowancesSum = ledger.history.filter(h => h.category === 'Allowance').reduce((sum, h) => sum + h.amount, 0);
  const deductionsSum = ledger.history.filter(h => h.category === 'Deduction').reduce((sum, h) => sum + h.amount, 0);
  const advancesSum = ledger.history.filter(h => h.category === 'Deduction' && h.deductionType === 'ADVANCE').reduce((sum, h) => sum + h.amount, 0);
  const salaryPaid = ledger.stats.totalPaid || 0;
  const grossCalculated = workEntriesSum + allowancesSum;
  const pendingBalance = ledger.stats.balance || 0;

  return (
    <div className="worker-details-page">
      <PageHeader 
        title={worker.name} 
        subtitle={`${worker.role} | Joined: ${formatDate(worker.joinDate)}`}
        actionLabel="Back to Workers"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/admin/workers')}
      >
        <Button variant="secondary" icon={HiOutlinePrinter} onClick={() => window.print()}>Print Ledger</Button>
      </PageHeader>

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Balance</label>
          <div className={`stat-val font-bold`} style={{ fontSize: '1.5rem', color: pendingBalance > 0 ? 'var(--primary)' : 'var(--text)' }}>
            {formatCurrency(pendingBalance)}
          </div>
        </Card>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Work Entries</label>
          <div className="stat-val font-bold" style={{ fontSize: '1.5rem' }}>{formatCurrency(workEntriesSum)}</div>
        </Card>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary Calculations</label>
          <div className="stat-val font-bold" style={{ fontSize: '1.5rem' }}>{formatCurrency(grossCalculated)}</div>
        </Card>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary Expenses (Paid)</label>
          <div className="stat-val font-bold text-blue" style={{ fontSize: '1.5rem' }}>{formatCurrency(salaryPaid)}</div>
        </Card>
      </div>

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Advances</label>
          <div className="stat-val font-bold text-red" style={{ fontSize: '1.5rem' }}>{formatCurrency(advancesSum)}</div>
        </Card>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allowances</label>
          <div className="stat-val font-bold text-green" style={{ fontSize: '1.5rem' }}>{formatCurrency(allowancesSum)}</div>
        </Card>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deductions</label>
          <div className="stat-val font-bold text-red" style={{ fontSize: '1.5rem' }}>{formatCurrency(deductionsSum)}</div>
        </Card>
        <Card className="stat-card">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Paid</label>
          <div className="stat-val font-bold text-blue" style={{ fontSize: '1.5rem' }}>{formatCurrency(salaryPaid)}</div>
        </Card>
      </div>

      <Card title="Worker Ledger History" className="ledger-card" padding={false}>
        <DataTable 
          columns={[
            { key: 'date', label: 'Date', render: (val) => formatDate(val) },
            { key: 'category', label: 'Description', render: (val, row) => (
              <div className="desc-cell">
                <span className="font-semibold">{val}</span>
                {row.workSite && <span className="text-xs text-muted block" style={{ fontSize: '0.75rem', marginTop: '2px' }}>Site: {row.workSite.name}</span>}
                {row.remark && <span className="text-xs text-muted block" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{row.remark}</span>}
                {row.allowanceType && <Badge variant="success" style={{ marginTop: '4px' }}>{row.allowanceType}</Badge>}
                {row.deductionType && <Badge variant="danger" style={{ marginTop: '4px' }}>{row.deductionType}</Badge>}
                {row.workType && <span className="text-xs text-muted block" style={{ fontSize: '0.75rem', marginTop: '2px' }}>Type: {row.workType}</span>}
              </div>
            )},
            { key: 'amount', label: 'Credit (Earnings)', align: 'right', render: (val, row) => (
              row.type === 'EARNING' ? <span className="text-green">+{formatCurrency(val)}</span> : '—'
            )},
            { key: 'debit', label: 'Debit (Payments/Ded)', align: 'right', render: (_, row) => (
              (row.type === 'PAYMENT' || row.type === 'DEDUCTION') ? <span className="text-red font-medium">-{formatCurrency(row.amount)}</span> : '—'
            )}
          ]}
          data={ledger.history}
        />
      </Card>
    </div>
  );
}
