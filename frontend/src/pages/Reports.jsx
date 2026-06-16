import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { reportApi } from '../api/reports';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlineCube, HiOutlineCurrencyRupee, HiOutlineDownload, HiOutlineTag } from 'react-icons/hi';
import './Reports.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setReportData(null);
    setLoading(true);
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'profit-loss' || activeTab === 'product-profit-loss') {
        res = await reportApi.getProfitLoss(filters);
      } else if (activeTab === 'gst') {
        res = await reportApi.getGst(filters);
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
    if (!reportData || reportData.revenue === undefined) return null;
    const { 
      revenue, productSales, serviceSales, 
      salaryPaid, purchaseExpenses, siteExpenses, operationalExpenses, travelExpenses, foodExpenses, otherExpenses,
      totalExpenses, netProfit 
    } = reportData;

    return (
      <div className="report-content">
        {/* P&L Stat Summary */}
        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Revenue</span>
            <span className="stat-value font-bold" style={{ fontSize: '1.5rem' }}>{formatCurrency(revenue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Expenses</span>
            <span className="stat-value font-bold text-red" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalExpenses)}</span>
          </Card>
          <Card className="report-stat-card highlight">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Profit</span>
            <span className={`stat-value font-bold ${netProfit >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: '1.5rem' }}>
              {formatCurrency(netProfit)}
            </span>
          </Card>
        </div>

        {/* Detailed Profit & Loss Statement */}
        <Card title="Profit & Loss Statement" className="mt-20">
          <div className="financial-statement" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Income Section */}
            <div>
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>INCOME</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Product Sales</span>
                  <span>{formatCurrency(productSales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Service Sales</span>
                  <span>{formatCurrency(serviceSales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 700, backgroundColor: 'var(--bg-light)', borderRadius: '4px', marginTop: '0.25rem' }}>
                  <span>TOTAL REVENUE</span>
                  <span>{formatCurrency(revenue)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-red)' }}>EXPENSES</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Salary Paid</span>
                  <span>{formatCurrency(salaryPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Purchase Expenses (Inventory & Bills)</span>
                  <span>{formatCurrency(purchaseExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Site Expenses</span>
                  <span>{formatCurrency(siteExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Operational Expenses (Office & Utilities)</span>
                  <span>{formatCurrency(operationalExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Travel Expenses</span>
                  <span>{formatCurrency(travelExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Food Expenses</span>
                  <span>{formatCurrency(foodExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Other Expenses</span>
                  <span>{formatCurrency(otherExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 700, backgroundColor: 'var(--bg-light)', borderRadius: '4px', marginTop: '0.25rem' }}>
                  <span>TOTAL EXPENSES</span>
                  <span>{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Position Summary */}
            <div style={{ borderTop: '3px double var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 800, fontSize: '1.1rem', backgroundColor: netProfit >= 0 ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)', borderRadius: '6px' }}>
                <span>NET PROFIT / LOSS</span>
                <span className={netProfit >= 0 ? 'text-green' : 'text-red'}>{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderProductProfitLoss = () => {
    if (!reportData || !reportData.productPnL) return null;
    const { revenue, cogs, grossProfit, directExpenses, purchases, netProfit } = reportData.productPnL;

    return (
      <div className="report-content">
        {/* Product P&L Summary Cards */}
        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Product Sales Revenue</span>
            <span className="stat-value font-bold text-green" style={{ fontSize: '1.5rem' }}>{formatCurrency(revenue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cost of Goods Sold (COGS)</span>
            <span className="stat-value font-bold text-red" style={{ fontSize: '1.5rem' }}>{formatCurrency(cogs)}</span>
          </Card>
          <Card className="report-stat-card highlight">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Product Net Profit</span>
            <span className={`stat-value font-bold ${netProfit >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: '1.5rem' }}>
              {formatCurrency(netProfit)}
            </span>
          </Card>
        </div>

        {/* Detailed Product P&L Statement */}
        <Card title="Product Profit & Loss Statement" className="mt-20">
          <div className="financial-statement" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Income Section */}
            <div>
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>PRODUCT REVENUE</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Sales Revenue (Product Items Sold)</span>
                  <span className="font-semibold">{formatCurrency(revenue)}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold Section */}
            <div>
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-red)' }}>COST OF GOODS SOLD</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Cost of Goods Sold (COGS - Purchase Cost of Items Sold)</span>
                  <span className="font-semibold text-red">-{formatCurrency(cogs)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 700, backgroundColor: 'var(--bg-light)', borderRadius: '4px', marginTop: '0.25rem' }}>
                  <span>PRODUCT GROSS PROFIT</span>
                  <span className={grossProfit >= 0 ? 'text-green' : 'text-red'}>{formatCurrency(grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* Direct & Carriage Expenses Section */}
            <div>
              <h4 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-red)' }}>DIRECT & OPERATING PRODUCT EXPENSES</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                  <span>Direct Purchase Expenses (Carriage, Logistics & Materials)</span>
                  <span>{formatCurrency(directExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 700, backgroundColor: 'var(--bg-light)', borderRadius: '4px', marginTop: '0.25rem' }}>
                  <span>TOTAL DIRECT EXPENSES</span>
                  <span>{formatCurrency(directExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Position Summary */}
            <div style={{ borderTop: '3px double var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 800, fontSize: '1.1rem', backgroundColor: netProfit >= 0 ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)', borderRadius: '6px' }}>
                <span>PRODUCT NET PROFIT / LOSS</span>
                <span className={netProfit >= 0 ? 'text-green' : 'text-red'}>{formatCurrency(netProfit)}</span>
              </div>
            </div>

            {/* Inventory Reference Info */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Inventory Reference during this period:</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <span>Total Purchased Stock (Supplier Purchase Bills)</span>
                <span>{formatCurrency(purchases)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Product-by-Product Profit & Loss Table */}
        <Card title="Product-by-Product Profit & Loss" className="mt-20" padding={false}>
          <table className="report-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th className="text-right">Purchased Qty</th>
                <th className="text-right">Purchased Cost</th>
                <th className="text-right">Sold Qty</th>
                <th className="text-right">Sales Revenue</th>
                <th className="text-right">COGS</th>
                <th className="text-right">Net Profit / Loss</th>
                <th className="text-right">Margin (%)</th>
              </tr>
            </thead>
            <tbody>
              {reportData.productPnL.productBreakdown && reportData.productPnL.productBreakdown.length > 0 ? (
                reportData.productPnL.productBreakdown.map((p, i) => (
                  <tr key={i}>
                    <td>{p.productName}</td>
                    <td className="text-right">{p.purchasedQty}</td>
                    <td className="text-right">{formatCurrency(p.purchasedAmount)}</td>
                    <td className="text-right">{p.soldQty}</td>
                    <td className="text-right">{formatCurrency(p.soldAmount)}</td>
                    <td className="text-right">{formatCurrency(p.cogs)}</td>
                    <td className={`text-right font-bold ${p.profit >= 0 ? 'text-green' : 'text-red'}`}>
                      {formatCurrency(p.profit)}
                    </td>
                    <td className={`text-right ${p.margin >= 0 ? 'text-green' : 'text-red'}`}>
                      {p.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No product transactions found in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const renderGstReport = () => {
    if (!reportData || reportData.totalGstCollected === undefined) return null;
    const { totalGstCollected, gstPaidOnPurchases, gstPaidOnExpenses, totalGstPaid, netGstPosition } = reportData;

    return (
      <div className="report-content">
        {/* GST Overview Cards */}
        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total GST Collected</span>
            <span className="stat-value font-bold text-green" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalGstCollected)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total GST Paid</span>
            <span className="stat-value font-bold text-red" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalGstPaid)}</span>
          </Card>
          <Card className="report-stat-card highlight">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net GST Position</span>
            <span className={`stat-value font-bold ${netGstPosition >= 0 ? 'text-green' : 'text-orange'}`} style={{ fontSize: '1.5rem' }}>
              {formatCurrency(netGstPosition)}
            </span>
          </Card>
        </div>

        {/* GST Breakdown */}
        <Card title="GST Expense Summary Statement">
          <div className="financial-statement" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>Total GST Collected (from Client Sales Invoices)</span>
              <span className="font-semibold text-green">+{formatCurrency(totalGstCollected)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>GST Paid on Product Purchases (Supplier Invoices)</span>
              <span className="font-semibold text-red">-{formatCurrency(gstPaidOnPurchases)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>GST Paid on Direct Operating Expenses</span>
              <span className="font-semibold text-red">-{formatCurrency(gstPaidOnExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700 }}>
              <span>Total Input GST Credit (Paid)</span>
              <span className="text-red">{formatCurrency(totalGstPaid)}</span>
            </div>
            <div style={{ borderTop: '3px double var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 800, fontSize: '1.1rem', backgroundColor: 'var(--bg-light)', borderRadius: '6px' }}>
                <span>NET GST PAYABLE / CREDIT POSITION</span>
                <span className={netGstPosition >= 0 ? 'text-green' : 'text-orange'}>
                  {netGstPosition >= 0 ? `${formatCurrency(netGstPosition)} (Payable)` : `${formatCurrency(Math.abs(netGstPosition))} (Credit)`}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderInventory = () => {
    if (!reportData || !reportData.products) return null;
    return (
      <div className="report-content">
        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Stock Value (CP)</span>
            <span className="stat-value font-bold" style={{ fontSize: '1.5rem' }}>{formatCurrency(reportData.totalValue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Potential Revenue (SP)</span>
            <span className="stat-value font-bold text-blue" style={{ fontSize: '1.5rem' }}>{formatCurrency(reportData.potentialRevenue)}</span>
          </Card>
          <Card className="report-stat-card">
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Product Types</span>
            <span className="stat-value font-bold" style={{ fontSize: '1.5rem' }}>{reportData.totalItems}</span>
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
        subtitle="Analyze your business growth, GST positions, and inventory health"
        actionLabel="Export PDF"
        actionIcon={HiOutlineDownload}
        onAction={() => window.print()}
      />

      <div className="report-tabs">
        <button 
          className={`tab-btn ${activeTab === 'profit-loss' ? 'active' : ''}`}
          onClick={() => handleTabChange('profit-loss')}
        >
          <HiOutlineCurrencyRupee /> General P & L
        </button>
        <button 
          className={`tab-btn ${activeTab === 'product-profit-loss' ? 'active' : ''}`}
          onClick={() => handleTabChange('product-profit-loss')}
        >
          <HiOutlineCube /> Product P & L
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gst' ? 'active' : ''}`}
          onClick={() => handleTabChange('gst')}
        >
          <HiOutlineTag /> GST Expense Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleTabChange('inventory')}
        >
          <HiOutlineCube /> Inventory Report
        </button>
      </div>

      {(activeTab === 'profit-loss' || activeTab === 'product-profit-loss' || activeTab === 'gst') && (
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

      {loading ? <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading report...</p> : (
        activeTab === 'profit-loss' ? renderProfitLoss() : 
        activeTab === 'product-profit-loss' ? renderProductProfitLoss() : 
        activeTab === 'gst' ? renderGstReport() : 
        renderInventory()
      )}
    </div>
  );
}
