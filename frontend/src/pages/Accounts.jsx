import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import AccountForm from '../components/accounts/AccountForm';
import LedgerEntryForm from '../components/accounts/LedgerEntryForm';
import { accountApi } from '../api/accounts';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineCreditCard,
  HiOutlineSearch,
} from 'react-icons/hi';
import './Accounts.css';

const LEDGER_TYPE_LABELS = {
  SALE_CREDIT: { label: 'Sale', variant: 'success' },
  PURCHASE_DEBIT: { label: 'Purchase', variant: 'danger' },
  EXPENSE_DEBIT: { label: 'Expense', variant: 'warning' },
  SALARY_DEBIT: { label: 'Salary', variant: 'info' },
  MANUAL_ADJUSTMENT: { label: 'Adjustment', variant: 'primary' },
  TRANSFER: { label: 'Transfer', variant: 'default' },
};

export default function Accounts() {
  const navigate = useNavigate();
  // ─── State ──────────────────────────────────────────────────
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Ledger
  const [ledgerData, setLedgerData] = useState({ account: null, items: [], pagination: {} });
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Summary
  const [summary, setSummary] = useState({ totalAccounts: 0, totalBalance: 0 });

  // ─── Fetch ──────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountApi.getAll({ search: searchQuery });
      setAccounts(res.data?.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await accountApi.getSummary();
      setSummary(res.data || { totalAccounts: 0, totalBalance: 0 });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchSummary();
  }, [fetchAccounts, fetchSummary]);

  // ─── CRUD Handlers ─────────────────────────────────────────
  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await accountApi.create(data);
      toast.success('Account created successfully');
      setShowAddModal(false);
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      await accountApi.update(selectedAccount.id, data);
      toast.success('Account updated successfully');
      setShowEditModal(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (err) {
      toast.error(err.message || 'Failed to update account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete "${account.accountName}"? This cannot be undone.`)) return;
    try {
      await accountApi.delete(account.id);
      toast.success('Account deleted');
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    }
  };

  // ─── Ledger Handlers ───────────────────────────────────────
  const openLedger = async (account) => {
    setSelectedAccount(account);
    setShowLedgerModal(true);
    setLedgerLoading(true);
    try {
      const res = await accountApi.getLedger(account.id);
      setLedgerData(res.data || { account: null, items: [], pagination: {} });
    } catch (err) {
      toast.error(err.message || 'Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleAddEntry = async (data) => {
    setSubmitting(true);
    try {
      await accountApi.addLedgerEntry(selectedAccount.id, data);
      toast.success('Transaction recorded');
      setShowEntryModal(false);
      // Refresh ledger and accounts
      openLedger(selectedAccount);
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Table Columns ─────────────────────────────────────────
  const columns = [
    {
      key: 'accountName',
      label: 'Account / Bank',
      render: (val, row) => (
        <div>
          <div className="font-semibold">{val}</div>
          {row.bankName && <div className="text-xs text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>{row.bankName}</div>}
        </div>
      ),
    },
    {
      key: 'accountNumber',
      label: 'Account No / PAN',
      render: (val, row) => (
        <div style={{ lineHeight: '1.4' }}>
          <div><span className="text-muted" style={{ fontSize: '11px' }}>A/c:</span> {val || '—'}</div>
          {row.panCardNumber && (
            <div><span className="text-muted" style={{ fontSize: '11px' }}>PAN:</span> {row.panCardNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'currentBalance',
      label: 'Balance',
      align: 'right',
      render: (val, row) => (
        <div style={{ textAlign: 'right' }}>
          <div className={val >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(val)}</div>
          <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
            Open: {formatCurrency(row.openingBalance)}
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_val, row) => (
        <div className="accounts__actions">
          <button className="accounts__action-btn" title="View Details" onClick={() => navigate(`/admin/accounts/${row.id}`)}>
            <HiOutlineEye />
          </button>
          <button className="accounts__action-btn" title="Edit" onClick={() => { setSelectedAccount(row); setShowEditModal(true); }}>
            <HiOutlinePencil />
          </button>
          <button className="accounts__action-btn accounts__action-btn--danger" title="Delete" onClick={() => handleDelete(row)}>
            <HiOutlineTrash />
          </button>
        </div>
      ),
    },
  ];

  const ledgerColumns = [
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'type', label: 'Type', render: (val) => {
      const info = LEDGER_TYPE_LABELS[val] || { label: val, variant: 'default' };
      return <Badge variant={info.variant}>{info.label}</Badge>;
    }},
    { key: 'amount', label: 'Amount', align: 'right', render: (val, row) => {
      const isDebit = ['PURCHASE_DEBIT', 'EXPENSE_DEBIT', 'SALARY_DEBIT'].includes(row.type);
      return <span className={isDebit ? 'text-danger' : 'text-success'}>{isDebit ? '-' : '+'}{formatCurrency(val)}</span>;
    }},
    { key: 'balanceAfter', label: 'Balance', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'reference', label: 'Reference', render: (val) => val || '—' },
    { key: 'remark', label: 'Remark', render: (val) => val || '—' },
  ];

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="page-wrapper" id="page-accounts">
      <PageHeader
        title="Accounts"
        subtitle="Manage financial accounts and track transactions"
        actionLabel="Add Account"
        actionIcon={HiOutlinePlus}
        onAction={() => setShowAddModal(true)}
      />

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="accounts__summary">
        <Card className="accounts__summary-card">
          <div className="accounts__summary-icon accounts__summary-icon--green">
            <HiOutlineCreditCard />
          </div>
          <div>
            <span className="accounts__summary-label">Total Accounts</span>
            <span className="accounts__summary-value">{summary.totalAccounts}</span>
          </div>
        </Card>
        <Card className="accounts__summary-card">
          <div className="accounts__summary-icon accounts__summary-icon--blue">
            <HiOutlineCreditCard />
          </div>
          <div>
            <span className="accounts__summary-label">Total Balance</span>
            <span className="accounts__summary-value">{formatCurrency(summary.totalBalance)}</span>
          </div>
        </Card>
      </div>

      {/* Account List */}
      <Card padding={false}>
        {loading ? (
          <div style={{ padding: 24 }}>
            <LoadingSkeleton height="40px" count={5} />
          </div>
        ) : (
          <DataTable columns={columns} data={accounts} emptyMessage="No accounts added yet. Create your first account!" />
        )}
      </Card>

      {/* Add Account Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Account" size="lg">
        <AccountForm onSubmit={handleCreate} onCancel={() => setShowAddModal(false)} loading={submitting} />
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedAccount(null); }} title="Edit Account" size="lg">
        <AccountForm account={selectedAccount} onSubmit={handleUpdate} onCancel={() => { setShowEditModal(false); setSelectedAccount(null); }} loading={submitting} />
      </Modal>

      {/* Ledger Modal */}
      <Modal isOpen={showLedgerModal} onClose={() => { setShowLedgerModal(false); setSelectedAccount(null); }} title={`Ledger — ${selectedAccount?.accountName || ''}`} size="xl">
        <div className="ledger-modal">
          <div className="ledger-modal__header">
            <div className="ledger-modal__balance">
              <span className="ledger-modal__balance-label">Current Balance</span>
              <span className="ledger-modal__balance-value">
                {formatCurrency(ledgerData.account?.currentBalance || selectedAccount?.currentBalance || 0)}
              </span>
            </div>
            <Button icon={HiOutlinePlus} size="sm" onClick={() => setShowEntryModal(true)}>
              Add Transaction
            </Button>
          </div>
          {ledgerLoading ? (
            <div style={{ padding: 20 }}><LoadingSkeleton height="36px" count={6} /></div>
          ) : (
            <DataTable columns={ledgerColumns} data={ledgerData.items || []} emptyMessage="No transactions recorded yet" />
          )}
        </div>
      </Modal>

      {/* Add Ledger Entry Modal */}
      <Modal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)} title="Record Transaction" size="md">
        <LedgerEntryForm onSubmit={handleAddEntry} onCancel={() => setShowEntryModal(false)} loading={submitting} />
      </Modal>
    </div>
  );
}
