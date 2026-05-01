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
} from 'react-icons/hi';

/**
 * Sidebar navigation items.
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: HiOutlineHome },
  { label: 'Sales Invoice', path: '/sales-invoice', icon: HiOutlineDocumentText },
  { label: 'Customers', path: '/customers', icon: HiOutlineUserGroup },
  { label: 'Products', path: '/products', icon: HiOutlineCube },
  { label: 'Accounts', path: '/accounts', icon: HiOutlineCreditCard },
  { label: 'Expenses', path: '/expenses', icon: HiOutlineCash },
  { label: 'Work Sites', path: '/work-sites', icon: HiOutlineLocationMarker },
  { label: 'Workers', path: '/workers', icon: HiOutlineUserGroup },
  { label: 'Salary', path: '/salary', icon: HiOutlineCurrencyRupee },
  { label: 'Reports', path: '/reports', icon: HiOutlineChartBar },
  { label: 'Settings', path: '/settings', icon: HiOutlineCog },
];

/**
 * App metadata.
 */
export const APP_NAME = 'Power Volt';
export const APP_VERSION = '1.0.0';
export const CURRENCY_SYMBOL = '₹';
export const DEFAULT_PAGE_SIZE = 20;
