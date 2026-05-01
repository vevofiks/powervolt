import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import DataTable from '../ui/DataTable';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { accountApi } from '../../api/accounts';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { 
  HiOutlineDownload, 
  HiOutlinePrinter, 
  HiOutlineFilter,
  HiOutlineArrowNarrowDown,
  HiOutlineArrowNarrowUp,
  HiOutlineScale
} from 'react-icons/hi';
import './AccountStatement.css';

const MODULE_LABELS = {
  SALES_INVOICE: { label: 'Sales Invoice', variant: 'success' },
  PURCHASE_INVOICE: { label: 'Purchase Bill', variant: 'danger' },
  EXPENSE: { label: 'Expense', variant: 'warning' },
  SALARY: { label: 'Salary Payment', variant: 'info' },
  TRANSFER: { label: 'Internal Transfer', variant: 'primary' },
  ADJUSTMENT: { label: 'Manual Adjustment', variant: 'default' }
};

export default function AccountStatement({ accountId }) {
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState({ items: [], summary: {}, pagination: {} });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    moduleType: '',
    type: '', // CREDIT or DEBIT
    search: ''
  });

  const fetchStatement = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountApi.getStatement(accountId, filters);
      setStatement(res.data || { items: [], summary: {}, pagination: {} });
    } catch (err) {
      toast.error(err.message || 'Failed to load statement');
    } finally {
      setLoading(false);
    }
  }, [accountId, filters]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'referenceNo', label: 'Ref No', render: (val) => <span className="font-mono text-xs">{val || '—'}</span> },
    { key: 'description', label: 'Description', render: (val) => <span className="text-sm">{val}</span> },
    { key: 'moduleType', label: 'Source', render: (val) => {
      const info = MODULE_LABELS[val] || { label: val, variant: 'default' };
      return <Badge variant={info.variant}>{info.label}</Badge>;
    }},
    { key: 'credit', label: 'Credit (In)', align: 'right', render: (val) => val > 0 ? (
      <span className="text-success font-semibold">+{formatCurrency(val)}</span>
    ) : '—' },
    { key: 'debit', label: 'Debit (Out)', align: 'right', render: (val) => val > 0 ? (
      <span className="text-danger font-semibold">-{formatCurrency(val)}</span>
    ) : '—' },
    { key: 'balanceAfter', label: 'Running Balance', align: 'right', render: (val) => (
      <span className="font-bold">{formatCurrency(val)}</span>
    )}
  ];

  return (
    <div className="statement-container">
      {/* Summary Cards */}
      <div className="statement-summary">
        <Card className="summary-card">
          <div className="summary-icon icon-credit"><HiOutlineArrowNarrowDown /></div>
          <div className="summary-info">
            <span className="summary-label">Total Credits</span>
            <span className="summary-value text-success">{formatCurrency(statement.summary.totalCredit || 0)}</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon icon-debit"><HiOutlineArrowNarrowUp /></div>
          <div className="summary-info">
            <span className="summary-label">Total Debits</span>
            <span className="summary-value text-danger">{formatCurrency(statement.summary.totalDebit || 0)}</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon icon-balance"><HiOutlineScale /></div>
          <div className="summary-info">
            <span className="summary-label">Net Movement</span>
            <span className={`summary-value ${statement.summary.netMovement >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(statement.summary.netMovement || 0)}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="statement-filters">
        <div className="filters-grid">
          <div className="filter-group date-range-group">
            <label>Date Range</label>
            <div className="date-inputs">
              <input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} 
              />
              <span>to</span>
              <input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} 
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label>Module</label>
            <select 
              value={filters.moduleType} 
              onChange={(e) => setFilters(prev => ({ ...prev, moduleType: e.target.value }))}
            >
              <option value="">All Sources</option>
              {Object.entries(MODULE_LABELS).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type</label>
            <select 
              value={filters.type} 
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Transactions</option>
              <option value="CREDIT">Credits (Money In)</option>
              <option value="DEBIT">Debits (Money Out)</option>
            </select>
          </div>

          <div className="filter-actions">
            <Button variant="secondary" icon={HiOutlinePrinter} onClick={handlePrint}>Print</Button>
            <Button variant="primary" icon={HiOutlineDownload}>Export</Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card padding={false} className="statement-table-card">
        {loading ? (
          <div style={{ padding: 20 }}><LoadingSkeleton height="40px" count={8} /></div>
        ) : (
          <DataTable 
            columns={columns} 
            data={statement.items} 
            emptyMessage="No transactions found for this period"
          />
        )}
      </Card>
    </div>
  );
}
