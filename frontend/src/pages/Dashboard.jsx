import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { dashboardApi } from '../api/dashboard';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { 
  HiOutlineCurrencyRupee, 
  HiOutlineCube, 
  HiOutlineExclamationCircle,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-wrapper"><LoadingSkeleton count={4} height={120} /></div>;
  if (!data) return <div className="page-wrapper">Failed to load data</div>;

  const { summary, recentSales, recentExpenses, accountBalances } = data;

  const stats = [
    { label: 'Monthly Sales', value: formatCurrency(summary.monthlySales), icon: HiOutlineTrendingUp, color: 'green' },
    { label: 'Monthly Expenses', value: formatCurrency(summary.monthlyExpenses), icon: HiOutlineTrendingDown, color: 'orange' },
    { label: 'Inventory Value', value: formatCurrency(summary.totalStockValue), icon: HiOutlineCube, color: 'blue' },
    { label: 'Total Invoices', value: (summary.salesCount || 0).toString(), icon: HiOutlineExclamationCircle, color: 'red' },
  ];



  const quickActions = [
    { label: 'Create Sale', path: '/admin/sales-invoice/create', icon: HiOutlineTrendingUp, color: 'green' },
    { label: 'Add Expense', path: '/admin/expenses', icon: HiOutlineTrendingDown, color: 'orange' },
    { label: 'Purchase Bill', path: '/admin/purchase-invoice/create', icon: HiOutlineOfficeBuilding, color: 'blue' },
    { label: 'Staff Salary', path: '/admin/salary', icon: HiOutlineCurrencyRupee, color: 'purple' },
  ];

  return (
    <div className="page-wrapper" id="page-dashboard">
      <PageHeader title="Dashboard" subtitle="Overview of your business performance this month" />

      <div className="dashboard__quick-actions">
        {quickActions.map(action => (
          <button key={action.label} className="quick-action-btn" onClick={() => navigate(action.path)}>
            <div className={`action-icon icon--${action.color}`}><action.icon /></div>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard__stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="dashboard__stat-card">
              <div className="dashboard__stat-content">
                <span className="dashboard__stat-label">{stat.label}</span>
                <span className="dashboard__stat-value">{stat.value}</span>
              </div>
              <div className={`dashboard__stat-icon dashboard__stat-icon--${stat.color}`}>
                <Icon />
              </div>
            </Card>
          );
        })}
      </div>

      <h3 className="dashboard__section-title" style={{ marginTop: '2rem', marginBottom: '1rem', paddingLeft: '0.25rem' }}>Financial Health Overview (All-Time)</h3>
      <div className="dashboard__stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), icon: HiOutlineTrendingUp, color: 'green' },
          { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses), icon: HiOutlineTrendingDown, color: 'red' },
          { label: 'Net Profit', value: formatCurrency(summary.netProfit), icon: HiOutlineCurrencyRupee, color: summary.netProfit >= 0 ? 'green' : 'red' },
          { label: 'Salary Payable', value: formatCurrency(summary.salaryPayable), icon: HiOutlineCurrencyRupee, color: 'orange' },
          { label: 'Salary Paid', value: formatCurrency(summary.salaryPaid), icon: HiOutlineCurrencyRupee, color: 'blue' },
          { label: 'GST Collected', value: formatCurrency(summary.gstCollected), icon: HiOutlineTrendingUp, color: 'green' },
          { label: 'GST Paid', value: formatCurrency(summary.gstPaid), icon: HiOutlineTrendingDown, color: 'orange' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="dashboard__stat-card" style={{ padding: '1rem' }}>
              <div className="dashboard__stat-content">
                <span className="dashboard__stat-label" style={{ fontSize: '0.8rem' }}>{stat.label}</span>
                <span className="dashboard__stat-value" style={{ fontSize: '1.25rem' }}>{stat.value}</span>
              </div>
              <div className={`dashboard__stat-icon dashboard__stat-icon--${stat.color}`} style={{ width: '40px', height: '40px', fontSize: '1.25rem' }}>
                <Icon />
              </div>
            </Card>
          );
        })}
      </div>

      <h3 className="dashboard__section-title" style={{ marginTop: '2rem', marginBottom: '1rem', paddingLeft: '0.25rem' }}>Purchased Products P&L (All-Time)</h3>
      <div className="dashboard__stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Product Sales Revenue', value: formatCurrency(summary.productRevenue), icon: HiOutlineTrendingUp, color: 'green' },
          { label: 'Product COGS', value: formatCurrency(summary.productCOGS), icon: HiOutlineTrendingDown, color: 'red' },
          { label: 'Product Net Profit', value: formatCurrency(summary.productProfit), icon: HiOutlineCurrencyRupee, color: summary.productProfit >= 0 ? 'green' : 'red' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="dashboard__stat-card" style={{ padding: '1rem' }}>
              <div className="dashboard__stat-content">
                <span className="dashboard__stat-label" style={{ fontSize: '0.8rem' }}>{stat.label}</span>
                <span className="dashboard__stat-value" style={{ fontSize: '1.25rem' }}>{stat.value}</span>
              </div>
              <div className={`dashboard__stat-icon dashboard__stat-icon--${stat.color}`} style={{ width: '40px', height: '40px', fontSize: '1.25rem' }}>
                <Icon />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="dashboard__grid">
        {/* Account Balances */}
        <Card className="dashboard__list-card">
          <h3 className="dashboard__section-title">Account Balances</h3>
          <div className="dashboard__list">
            {accountBalances.map((acc, i) => (
              <div key={i} className="dashboard__list-item">
                <span>{acc.accountName}</span>
                <span className="font-bold">{formatCurrency(acc.currentBalance)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Sales */}
        <Card className="dashboard__list-card">
          <h3 className="dashboard__section-title">Recent Sales</h3>
          <div className="dashboard__list">
            {recentSales.map((sale, i) => (
              <div key={i} className="dashboard__list-item">
                <div className="item-info">
                  <span className="item-title">{sale.invoiceNo}</span>
                  <span className="item-sub">{sale.customerName || 'Walk-in'}</span>
                </div>
                <div className="item-meta">
                  <span className="item-price">{formatCurrency(sale.totalAmount)}</span>
                  <span className="item-date">{formatDate(sale.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>


        {/* Recent Expenses */}
        <Card className="dashboard__list-card">
          <h3 className="dashboard__section-title">Recent Expenses</h3>
          <div className="dashboard__list">
            {recentExpenses.map((exp, i) => (
              <div key={i} className="dashboard__list-item">
                <div className="item-info">
                  <span className="item-title">{exp.category}</span>
                  <span className="item-sub">{exp.payee || 'N/A'}</span>
                </div>
                <div className="item-meta">
                  <span className="item-price text-red">{formatCurrency(exp.amount)}</span>
                  <span className="item-date">{formatDate(exp.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
