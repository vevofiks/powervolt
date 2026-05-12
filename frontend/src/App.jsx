import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import SalesInvoice from './pages/SalesInvoice';
import CreateSalesInvoice from './pages/CreateSalesInvoice';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Products from './pages/Products';
import Accounts from './pages/Accounts';
import AccountDetails from './pages/AccountDetails';
import Expenses from './pages/Expenses';
import WorkSites from './pages/WorkSites';
import WorkSiteDetails from './pages/WorkSiteDetails';
import Workers from './pages/Workers';
import WorkerDetails from './pages/WorkerDetails';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LandingPage from './pages/landing/LandingPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin">
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="sales-invoice" element={<SalesInvoice />} />
              <Route path="sales-invoice/create" element={<CreateSalesInvoice />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="products" element={<Products />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="accounts/:id" element={<AccountDetails />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="work-sites" element={<WorkSites />} />
              <Route path="work-sites/:id" element={<WorkSiteDetails />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="workers" element={<Workers />} />
              <Route path="staffs" element={<Workers />} />
              <Route path="workers/:id" element={<WorkerDetails />} />
              <Route path="salary" element={<Salary />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<div style={{ padding: 20 }}>Page Not Found</div>} />
            </Route>
          </Route>
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
