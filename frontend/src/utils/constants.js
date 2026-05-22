import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineLocationMarker,
  HiOutlineUserGroup,
  HiOutlineCurrencyRupee,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineCheckCircle,
  HiOutlineOfficeBuilding,
  HiOutlineInboxIn,
} from 'react-icons/hi';

/**
 * Sidebar navigation items.
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: HiOutlineHome },
  { label: 'Sales Invoice', path: '/admin/sales-invoice', icon: HiOutlineDocumentText },
  { label: 'Service Invoice', path: '/admin/service-invoice', icon: HiOutlineDocumentText },
  { label: 'Customers', path: '/admin/customers', icon: HiOutlineUserGroup },
  { label: 'Purchase Bills', path: '/admin/purchase-bills', icon: HiOutlineInboxIn },
  { label: 'Vendors', path: '/admin/vendors', icon: HiOutlineOfficeBuilding },
  { label: 'Products', path: '/admin/products', icon: HiOutlineCube },
  { label: 'Accounts', path: '/admin/accounts', icon: HiOutlineCreditCard },
  { label: 'Expenses', path: '/admin/expenses', icon: HiOutlineCash },
  { label: 'Work Sites', path: '/admin/work-sites', icon: HiOutlineLocationMarker },
  { label: 'Attendance', path: '/admin/attendance', icon: HiOutlineCheckCircle },
  { label: 'Workers', path: '/admin/workers', icon: HiOutlineUserGroup },
  { label: 'Salary', path: '/admin/salary', icon: HiOutlineCurrencyRupee },
  { label: 'Reports', path: '/admin/reports', icon: HiOutlineChartBar },
  { label: 'Settings', path: '/admin/settings', icon: HiOutlineCog },
];

/**
 * App metadata.
 */
export const APP_NAME = 'Power Volt';
export const APP_VERSION = '1.0.0';
export const CURRENCY_SYMBOL = '₹';
export const DEFAULT_PAGE_SIZE = 20;
