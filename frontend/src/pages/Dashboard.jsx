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

  const categoryStats = [
    {
      label: 'Product Invoices',
      count: summary.productSalesCount || 0,
      revenue: summary.productSalesRevenue || 0,
      emoji: '🏭',
      colorClass: 'product'
    },
    {
      label: 'Service Invoices',
      count: summary.serviceSalesCount || 0,
      revenue: summary.serviceSalesRevenue || 0,
      emoji: '🔧',
      colorClass: 'service'
    },
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

      {/* Invoice Category Stats */}
      <div className="dashboard__category-stats">
        {categoryStats.map((cat) => (
          <Card key={cat.label} className={`dashboard__category-card dashboard__category-card--${cat.colorClass}`}>
            <div className="dashboard__category-left">
              <span className="dashboard__category-emoji">{cat.emoji}</span>
              <div>
                <span className="dashboard__category-label">{cat.label}</span>
                <span className="dashboard__category-count">{cat.count} this month</span>
              </div>
            </div>
            <div className="dashboard__category-revenue">
              {formatCurrency(cat.revenue)}
            </div>
          </Card>
        ))}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="item-title">{sale.invoiceNo}</span>
                    <span
                      className="mini-category-badge"
                      style={{
                        background: sale.invoiceCategory === 'SERVICE' ? '#dbeafe' : '#dcfce7',
                        color: sale.invoiceCategory === 'SERVICE' ? '#1d4ed8' : '#15803d'
                      }}
                    >
                      {sale.invoiceCategory === 'SERVICE' ? '🔧' : '🏭'}
                    </span>
                  </div>
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
