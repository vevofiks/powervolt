import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { reportApi } from '../api/reports';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlineChartBar, HiOutlineCube, HiOutlineCurrencyRupee, HiOutlineDownload, HiOutlineTag } from 'react-icons/hi';
import './Reports.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'profit-loss') {
        res = await reportApi.getProfitLoss(filters);
      } else {
        res = await reportApi.getInventory();
      }
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const renderProfitLoss = () => {
    if (!reportData) return null;
    const { revenue, grossProfit, purchaseCost, operationalExpenses, netProfit, categoryStats, totalInvoiceCount } = reportData;
    const productStats = categoryStats?.product || { count: 0, revenue: 0 };
    const serviceStats = categoryStats?.service || { count: 0, revenue: 0 };
    
    return (
      <div className="report-content">
        {/* Overall Summary */}
        <div className="report-grid">
          <Card className="report-stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">{formatCurrency(revenue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label">Gross Profit</span>
            <span className="stat-value text-green">{formatCurrency(grossProfit)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value text-orange">{formatCurrency(operationalExpenses)}</span>
          </Card>
          <Card className="report-stat-card highlight">
            <span className="stat-label">Net Profit</span>
            <span className={`stat-value ${netProfit >= 0 ? 'text-green' : 'text-red'}`}>
              {formatCurrency(netProfit)}
            </span>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="category-stats-section">
          <h3 className="category-stats-title">Invoice Category Breakdown</h3>
          <div className="category-stats-grid">
            {/* Product Stats */}
            <div className="category-stat-card category-stat-card--product">
              <div className="category-stat-header">
                <span className="category-stat-icon">🏭</span>
                <span className="category-stat-label">Product Invoices</span>
              </div>
              <div className="category-stat-body">
                <div className="category-stat-row">
                  <span>Total Invoices</span>
                  <strong>{productStats.count}</strong>
                </div>
                <div className="category-stat-row">
                  <span>Product Revenue</span>
                  <strong className="text-green">{formatCurrency(productStats.revenue)}</strong>
                </div>
                {revenue > 0 && (
                  <div className="category-stat-row">
                    <span>Revenue Share</span>
                    <strong>{((productStats.revenue / revenue) * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>
              <div className="category-stat-bar">
                <div
                  className="category-stat-bar-fill category-stat-bar-fill--product"
                  style={{ width: revenue > 0 ? `${(productStats.revenue / revenue) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Service Stats */}
            <div className="category-stat-card category-stat-card--service">
              <div className="category-stat-header">
                <span className="category-stat-icon">🔧</span>
                <span className="category-stat-label">Service Invoices</span>
              </div>
              <div className="category-stat-body">
                <div className="category-stat-row">
                  <span>Total Invoices</span>
                  <strong>{serviceStats.count}</strong>
                </div>
                <div className="category-stat-row">
                  <span>Service Revenue</span>
                  <strong className="text-blue">{formatCurrency(serviceStats.revenue)}</strong>
                </div>
                {revenue > 0 && (
                  <div className="category-stat-row">
                    <span>Revenue Share</span>
                    <strong>{((serviceStats.revenue / revenue) * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>
              <div className="category-stat-bar">
                <div
                  className="category-stat-bar-fill category-stat-bar-fill--service"
                  style={{ width: revenue > 0 ? `${(serviceStats.revenue / revenue) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <Card title="Expense Breakdown" className="mt-20">
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span>Operational Expenses (Materials, Utilities, etc.)</span>
              <span>{formatCurrency(reportData.expenseBreakdown.materials)}</span>
            </div>
            <div className="breakdown-item">
              <span>Payroll (Staff Salaries)</span>
              <span>{formatCurrency(reportData.expenseBreakdown.salaries)}</span>
            </div>
            <div className="breakdown-item total">
              <span>Total Operating Cost</span>
              <span>{formatCurrency(operationalExpenses)}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderInventory = () => {
    if (!reportData) return null;
    return (
      <div className="report-content">
        <div className="report-grid">
          <Card className="report-stat-card">
            <span className="stat-label">Total Stock Value (CP)</span>
            <span className="stat-value">{formatCurrency(reportData.totalValue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label">Potential Revenue (SP)</span>
            <span className="stat-value text-blue">{formatCurrency(reportData.potentialRevenue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label">Total Product Types</span>
            <span className="stat-value">{reportData.totalItems}</span>
          </Card>
        </div>

        <Card title="Inventory Valuation" className="mt-20" padding={false}>
          <table className="report-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Unit Value (CP)</th>
                <th className="text-right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {reportData.products.map((p, i) => (
                <tr key={i}>
                  <td>{p.productName}</td>
                  <td>{p.category}</td>
                  <td className="text-right">{p.currentStock} {p.unit}</td>
                  <td className="text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="text-right font-bold">{formatCurrency(p.currentStock * p.purchasePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  return (
    <div className="page-wrapper reports-page">
      <PageHeader 
        title="Business Reports" 
        subtitle="Analyze your business growth and inventory health"
        actionLabel="Export PDF"
        actionIcon={HiOutlineDownload}
        onAction={() => window.print()}
      />

      <div className="report-tabs">
        <button 
          className={`tab-btn ${activeTab === 'profit-loss' ? 'active' : ''}`}
          onClick={() => setActiveTab('profit-loss')}
        >
          <HiOutlineCurrencyRupee /> Profit & Loss
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <HiOutlineCube /> Inventory Report
        </button>
      </div>

      {activeTab === 'profit-loss' && (
        <div className="report-filters">
          <Card>
            <div className="filter-row">
              <div className="date-input">
                <label>From Date</label>
                <input 
                  type="date" 
                  value={filters.startDate} 
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="date-input">
                <label>To Date</label>
                <input 
                  type="date" 
                  value={filters.endDate} 
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <Button onClick={fetchReport} variant="secondary">Apply Filters</Button>
            </div>
          </Card>
        </div>
      )}

      {loading ? <p>Loading report...</p> : (
        activeTab === 'profit-loss' ? renderProfitLoss() : renderInventory()
      )}
    </div>
  );
}
