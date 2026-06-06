import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { expenseApi } from '../api/expenses';
import { accountApi } from '../api/accounts';
import { workSiteApi } from '../api/workSites';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineSearch, HiOutlinePaperClip } from 'react-icons/hi';
import './Expenses.css';

const CATEGORIES = [
  { value: 'FUEL', label: 'Fuel' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'MATERIALS', label: 'Materials' },
  { value: 'SITE_EXPENSE', label: 'Site Expense' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'FOOD', label: 'Food' },
  { value: 'MISC', label: 'Miscellaneous' },
  { value: 'OTHER', label: 'Other' }
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [workSites, setWorkSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    accountId: '',
    workSiteId: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    category: 'MATERIALS',
    amount: '',
    payee: '',
    reference: '',
    notes: '',
    receiptUrl: '',
    accountId: '',
    workSiteId: '',
    items: [] // { description: '', qty: 1, rate: 0, amount: 0 }
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, accRes, siteRes] = await Promise.all([
        expenseApi.getAll(filters),
        accountApi.getAll(),
        workSiteApi.getAll()
      ]);
      setExpenses(expRes.data?.items || []);
      setAccounts(accRes.data?.items || []);
      setWorkSites(siteRes.data?.items || []);
      
      if (accRes.data?.items?.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: accRes.data.items[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filters, formData.accountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      payee: expense.payee || '',
      reference: expense.reference || '',
      notes: expense.notes || '',
      receiptUrl: expense.receiptUrl || '',
      accountId: expense.accountId,
      workSiteId: expense.workSiteId || '',
      items: expense.items || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingExpense) {
        await expenseApi.update(editingExpense.id, formData);
        toast.success('Expense updated');
      } else {
        await expenseApi.create(formData);
        toast.success('Expense recorded successfully');
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      category: 'MATERIALS',
      amount: '',
      payee: '',
      reference: '',
      notes: '',
      receiptUrl: '',
      accountId: accounts[0]?.id || '',
      workSiteId: '',
      items: []
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? Account balance will be reverted.')) return;
    try {
      await expenseApi.delete(id);
      toast.success('Expense deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const columns = [
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'title', label: 'Title', render: (val, row) => (
      <div className="title-cell">
        <span className="font-semibold">{val}</span>
        {row.receiptUrl && <HiOutlinePaperClip className="receipt-icon" title="Has Receipt" />}
      </div>
    )},
    { key: 'category', label: 'Category', render: (val) => <Badge variant="secondary">{val}</Badge> },
    { key: 'amount', label: 'Amount', align: 'right', render: (val) => <span className="expense-amount">{formatCurrency(val)}</span> },
    { key: 'account', label: 'Paid From', render: (val) => val?.accountName },
    { key: 'workSite', label: 'Work Site', render: (val) => val?.name || <span className="text-muted">General</span> },
    { key: 'id', label: 'Actions', render: (_, row) => (
      <div className="action-buttons">
        <button className="action-btn" onClick={() => handleEdit(row)} title="Edit"><HiOutlinePencil /></button>
        <button className="action-btn danger" onClick={() => handleDelete(row.id)} title="Delete"><HiOutlineTrash /></button>
      </div>
    )},
  ];

  // Helper to add a new item row
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', qty: 1, rate: 0, amount: 0 }]
    }));
  };

  // Helper to remove an item row
  const removeItem = (id) => {
    setFormData(prev => {
      const newItems = prev.items.filter(item => (item.id || item.description) !== id);
      const newTotal = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return { ...prev, items: newItems, amount: newItems.length > 0 ? newTotal : prev.amount };
    });
  };

  // Helper to update an item row
  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'qty' || field === 'rate') {
        const q = parseFloat(newItems[index].qty) || 0;
        const r = parseFloat(newItems[index].rate) || 0;
        newItems[index].amount = q * r;
      }
      
      const newTotal = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return { ...prev, items: newItems, amount: newTotal };
    });
  };

  return (
    <div className="page-wrapper expenses-page">
      <PageHeader 
        title="Expense Management" 
        subtitle="Record and monitor all business spending"
        actionLabel="Add Expense"
        actionIcon={HiOutlinePlus}
        onAction={() => { setEditingExpense(null); resetForm(); setIsModalOpen(true); }}
      />

      <div className="toolbar">
        <div className="toolbar__filters">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search title, payee, ref..." 
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select 
            className="filter-select"
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select 
            className="filter-select"
            value={filters.workSiteId}
            onChange={(e) => setFilters(prev => ({ ...prev, workSiteId: e.target.value }))}
          >
            <option value="">All Work Sites</option>
            {workSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <Card padding={false}>
        <DataTable 
          columns={columns} 
          data={expenses} 
          loading={loading}
          emptyMessage="No expenses found."
        />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="expense-form">
          <Input 
            label="Expense Title *" 
            required
            placeholder="e.g., Office Rent, Fuel for Van"
            value={formData.title} 
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
          <div className="form-row">
            <Input 
              label="Date" 
              type="date" 
              required
              value={formData.date} 
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
            <Select 
              label="Category" 
              required
              value={formData.category} 
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              options={CATEGORIES}
            />
          </div>
          <div className="form-row">
            <Input 
              label="Amount (₹) *" 
              type="number" 
              required
              placeholder="0.00"
              disabled={!!editingExpense} // Accounting integrity
              value={formData.amount} 
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            />
            <Select 
              label="Paid From Account" 
              required
              disabled={!!editingExpense} // Accounting integrity
              value={formData.accountId} 
              onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
              options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountName} (₹${acc.currentBalance})` }))}
            />
          </div>
          <div className="form-row">
            <Select 
              label="Work Site (Optional)" 
              value={formData.workSiteId} 
              onChange={(e) => setFormData(prev => ({ ...prev, workSiteId: e.target.value }))}
              options={[
                { value: '', label: 'General / No Site' },
                ...workSites.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
            <Input 
              label="Payee / Recipient" 
              placeholder="Who was paid?"
              value={formData.payee} 
              onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <Input 
              label="Reference / Bill No" 
              placeholder="Optional"
              value={formData.reference} 
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            />
            <Input 
              label="Receipt Image/PDF URL" 
              placeholder="Link to document"
              value={formData.receiptUrl} 
              onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
            />
          </div>
          <Input 
            label="Notes / Remarks" 
            placeholder="Extra details..."
            value={formData.notes} 
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />

          <div className="expense-items-section">
            <div className="section-header">
              <h3>Item Breakdown (Optional)</h3>
              <Button type="button" size="sm" variant="secondary" icon={HiOutlinePlus} onClick={addItem}>Add Item</Button>
            </div>
            
            {formData.items.length > 0 && (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ width: 100 }}>Qty</th>
                      <th style={{ width: 150 }}>Rate (₹)</th>
                      <th style={{ width: 150 }}>Amount (₹)</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>
                          <input 
                            className="item-input"
                            placeholder="e.g., Cement Bags"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            className="item-input"
                            value={item.qty}
                            onChange={(e) => updateItem(index, 'qty', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            className="item-input"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', e.target.value)}
                          />
                        </td>
                        <td className="item-amount">
                          {formatCurrency(item.amount)}
                        </td>
                        <td>
                          <button 
                            type="button" 
                            className="item-remove"
                            onClick={() => removeItem(item.id || item.description)}
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingExpense ? 'Update Expense' : 'Record Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
