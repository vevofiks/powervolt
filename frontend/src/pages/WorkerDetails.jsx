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
      navigate('/workers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return <div className="page-wrapper">Loading worker history...</div>;
  if (!worker || !ledger) return null;

  return (
    <div className="worker-details-page">
      <PageHeader 
        title={worker.name} 
        subtitle={`${worker.role} | Joined: ${formatDate(worker.joinDate)}`}
        actionLabel="Back to Workers"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/workers')}
      >
        <Button variant="secondary" icon={HiOutlinePrinter} onClick={() => window.print()}>Print Ledger</Button>
      </PageHeader>

      <div className="stats-row">
        <Card className="stat-card">
          <label>Pending Balance</label>
          <div className={`stat-val ${ledger.stats.balance > 0 ? 'text-green' : 'text-red'}`}>
            {formatCurrency(ledger.stats.balance)}
          </div>
        </Card>
        <Card className="stat-card">
          <label>Total Earned</label>
          <div className="stat-val">{formatCurrency(ledger.stats.totalEarned)}</div>
        </Card>
        <Card className="stat-card">
          <label>Total Deducted</label>
          <div className="stat-val text-red">{formatCurrency(ledger.stats.totalDeductions)}</div>
        </Card>
        <Card className="stat-card">
          <label>Total Paid</label>
          <div className="stat-val text-blue">{formatCurrency(ledger.stats.totalPaid)}</div>
        </Card>
      </div>

      <Card title="Worker Ledger" className="ledger-card" padding={false}>
        <DataTable 
          columns={[
            { key: 'date', label: 'Date', render: (val) => formatDate(val) },
            { key: 'category', label: 'Description', render: (val, row) => (
              <div className="desc-cell">
                <span className="font-semibold">{val}</span>
                {row.workSite && <span className="text-xs text-muted block">Site: {row.workSite.name}</span>}
                {row.remark && <span className="text-xs text-muted block">{row.remark}</span>}
                {row.workType && <span className="text-xs text-muted block">Type: {row.workType}</span>}
              </div>
            )},
            { key: 'amount', label: 'Credit (Earnings)', align: 'right', render: (val, row) => (
              row.type === 'EARNING' ? <span className="text-green">+{formatCurrency(val)}</span> : '—'
            )},
            { key: 'debit', label: 'Debit (Payments/Ded)', align: 'right', render: (_, row) => (
              (row.type === 'PAYMENT' || row.type === 'DEDUCTION') ? <span className="text-red">-{formatCurrency(row.amount)}</span> : '—'
            )}
          ]}
          data={ledger.history}
        />
      </Card>
    </div>
  );
}
