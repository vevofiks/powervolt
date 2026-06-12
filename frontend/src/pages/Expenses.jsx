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
import { workerApi } from '../api/workers';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineSearch, HiOutlinePaperClip } from 'react-icons/hi';
import './Expenses.css';

const CATEGORIES = [
  { value: 'SALARY_PAYMENT', label: 'Salary Payment' },
  { value: 'PURCHASE_EXPENSE', label: 'Purchase Expense' },
  { value: 'SITE_EXPENSE', label: 'Site Expense' },
  { value: 'TRAVEL_EXPENSE', label: 'Travel Expense' },
  { value: 'FOOD_EXPENSE', label: 'Food Expense' },
  { value: 'OFFICE_EXPENSE', label: 'Office Expense' },
  { value: 'UTILITY_EXPENSE', label: 'Utility Expense' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' }
];

const getCategoryLabel = (cat) => {
  const map = {
    SALARY_PAYMENT: 'Salary Payment',
    PURCHASE_EXPENSE: 'Purchase Expense',
    SITE_EXPENSE: 'Site Expense',
    TRAVEL_EXPENSE: 'Travel Expense',
    FOOD_EXPENSE: 'Food Expense',
    OFFICE_EXPENSE: 'Office Expense',
    UTILITY_EXPENSE: 'Utility Expense',
    MISCELLANEOUS: 'Miscellaneous',
    FUEL: 'Fuel',
    TRAVEL: 'Travel',
    MATERIALS: 'Materials',
    OFFICE: 'Office',
    FOOD: 'Food',
    MISC: 'Miscellaneous',
    OTHER: 'Other'
  };
  return map[cat] || cat;
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [workSites, setWorkSites] = useState([]);
  const [workers, setWorkers] = useState([]);
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
    category: 'SITE_EXPENSE',
    amount: '',
    gstPaid: '',
    payee: '',
    reference: '',
    notes: '',
    receiptUrl: '',
    accountId: '',
    workSiteId: '',
    workerId: '',
    items: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, accRes, siteRes, workerRes] = await Promise.all([
        expenseApi.getAll(filters),
        accountApi.getAll(),
        workSiteApi.getAll(),
        workerApi.getAll({ isActive: 'true', limit: 100 })
      ]);
      setExpenses(expRes.data?.items || []);
      setAccounts(accRes.data?.items || []);
      setWorkSites(siteRes.data?.items || []);
      setWorkers(workerRes.data?.items || []);
      
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

  // Autofill title if Salary Payment category and worker are selected
  useEffect(() => {
    if (formData.category === 'SALARY_PAYMENT' && formData.workerId) {
      const w = workers.find(worker => worker.id === formData.workerId);
      if (w) {
        setFormData(prev => ({ ...prev, title: `Salary Payment - ${w.name}` }));
      }
    }
  }, [formData.category, formData.workerId, workers]);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      gstPaid: expense.gstPaid || '',
      payee: expense.payee || '',
      reference: expense.reference || '',
      notes: expense.notes || '',
      receiptUrl: expense.receiptUrl || '',
      accountId: expense.accountId,
      workSiteId: expense.workSiteId || '',
      workerId: expense.workerId || '',
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
      category: 'SITE_EXPENSE',
      amount: '',
      gstPaid: '',
      payee: '',
      reference: '',
      notes: '',
      receiptUrl: '',
      accountId: accounts[0]?.id || '',
      workSiteId: '',
      workerId: '',
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
    { key: 'category', label: 'Category', render: (val) => <Badge variant="secondary">{getCategoryLabel(val)}</Badge> },
    { key: 'payee', label: 'Payee / Staff Member', render: (val, row) => row.worker ? <Badge variant="primary">{row.worker.name}</Badge> : (val || <span className="text-muted">—</span>) },
    { key: 'amount', label: 'Amount', align: 'right', render: (val, row) => (
      <div className="flex flex-col items-end">
        <span className="expense-amount font-semibold">{formatCurrency(val)}</span>
        {row.gstPaid > 0 && <span className="text-xs text-green" style={{ fontSize: '0.75rem' }}>GST: {formatCurrency(row.gstPaid)}</span>}
      </div>
    )},
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
    const item = formData.items.find(item => (item.id || item.description) === id);
    if (item) {
      const hasContent = item.description?.trim() || item.qty > 1 || item.rate > 0 || item.amount > 0;
      if (hasContent && !window.confirm('Are you sure you want to remove this item?')) return;
    }
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
              label="Amount Paid (₹) *" 
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
            {formData.category === 'SALARY_PAYMENT' ? (
              <Select 
                label="Staff Member *" 
                required
                value={formData.workerId} 
                onChange={(e) => setFormData(prev => ({ ...prev, workerId: e.target.value }))}
                options={[
                  { value: '', label: 'Select Staff Member' },
                  ...workers.map(w => ({ value: w.id, label: w.name }))
                ]}
              />
            ) : (
              <Input 
                label="GST Paid (₹) - Optional" 
                type="number" 
                placeholder="0.00"
                value={formData.gstPaid} 
                onChange={(e) => setFormData(prev => ({ ...prev, gstPaid: e.target.value }))}
              />
            )}
            <Select 
              label="Work Site (Optional)" 
              value={formData.workSiteId} 
              onChange={(e) => setFormData(prev => ({ ...prev, workSiteId: e.target.value }))}
              options={[
                { value: '', label: 'General / No Site' },
                ...workSites.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>

          <div className="form-row">
            <Input 
              label="Payee / Recipient" 
              placeholder={formData.category === 'SALARY_PAYMENT' ? 'Staff name' : 'Who was paid?'}
              value={formData.payee} 
              onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
            />
            <Input 
              label="Reference / Bill No" 
              placeholder="Optional"
              value={formData.reference} 
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <Input 
              label="Receipt Image/PDF URL" 
              placeholder="Link to document"
              value={formData.receiptUrl} 
              onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
            />
            <Input 
              label="Remarks / Notes" 
              placeholder="Extra details..."
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {formData.category !== 'SALARY_PAYMENT' && (
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
          )}
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingExpense ? 'Update Expense' : 'Record Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
