import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import AccountStatement from '../components/accounts/AccountStatement';
import LedgerEntryForm from '../components/accounts/LedgerEntryForm';
import { accountApi } from '../api/accounts';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { 
  HiOutlineChevronLeft, 
  HiOutlineOfficeBuilding, 
  HiOutlineClipboardList, 
  HiOutlineDocumentText 
} from 'react-icons/hi';
import './Accounts.css'; // Reusing some base styles

export default function AccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('statement'); // Default to statement as requested
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountApi.getById(id);
      setAccount(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load account');
      navigate('/admin/accounts');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const handleAddEntry = async (data) => {
    setSubmitting(true);
    try {
      await accountApi.addLedgerEntry(id, data);
      toast.success('Transaction recorded successfully');
      setShowEntryModal(false);
      fetchAccount();
    } catch (err) {
      toast.error(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-wrapper"><LoadingSkeleton count={10} height="40px" /></div>;
  if (!account) return null;

  return (
    <div className="page-wrapper">
      <PageHeader
        title={account.accountName}
        subtitle={`${account.bankName || 'Personal'} — ${account.accountNumber || 'N/A'}${account.panCardNumber ? ` | PAN: ${account.panCardNumber}` : ''}`}
        actionLabel="Back to Accounts"
        actionIcon={HiOutlineChevronLeft}
        onAction={() => navigate('/admin/accounts')}
        variant="secondary"
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={() => setShowEntryModal(true)}>Add Transaction</Button>
      </div>

      {/* Tabs */}
      <div className="details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <HiOutlineOfficeBuilding /> Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <HiOutlineClipboardList /> Ledger
        </button>
        <button 
          className={`tab-btn ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          <HiOutlineDocumentText /> Statements
        </button>
      </div>

      <div className="tab-content" style={{ marginTop: '24px' }}>
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <Card title="Account Information">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Account Name</span>
                  <span className="info-value">{account.accountName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Bank Name</span>
                  <span className="info-value">{account.bankName || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Number</span>
                  <span className="info-value">{account.accountNumber || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">PAN Card Number</span>
                  <span className="info-value">{account.panCardNumber || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <Badge variant={account.isActive ? 'success' : 'default'}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card title="Financial Summary">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Opening Balance</span>
                  <span className="info-value">{formatCurrency(account.openingBalance)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Balance</span>
                  <span className={`info-value font-bold ${account.currentBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(account.currentBalance)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created At</span>
                  <span className="info-value">{formatDate(account.createdAt)}</span>
                </div>
              </div>
            </Card>
            
            {account.notes && (
              <Card title="Notes" className="full-width">
                <p className="text-muted">{account.notes}</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'ledger' && (
          <Card padding={false}>
            <DataTable 
              columns={[
                { key: 'date', label: 'Date', render: (val) => formatDate(val) },
                { key: 'moduleType', label: 'Source', render: (val) => <Badge variant="default">{val}</Badge> },
                { key: 'credit', label: 'Credit', align: 'right', render: (val) => val > 0 ? formatCurrency(val) : '—' },
                { key: 'debit', label: 'Debit', align: 'right', render: (val) => val > 0 ? formatCurrency(val) : '—' },
                { key: 'balanceAfter', label: 'Balance', align: 'right', render: (val) => formatCurrency(val) },
              ]}
              data={account.ledgerTransactions || []}
              emptyMessage="No ledger entries found"
            />
          </Card>
        )}

        {activeTab === 'statement' && (
          <AccountStatement accountId={id} key={`statement-${account.currentBalance}`} />
        )}
      </div>

      <Modal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)} title="Record Transaction" size="md">
        <LedgerEntryForm onSubmit={handleAddEntry} onCancel={() => setShowEntryModal(false)} loading={submitting} />
      </Modal>
    </div>
  );
}
