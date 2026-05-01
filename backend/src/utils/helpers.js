/**
 * Utility helper functions.
 */

/**
 * Format a number as INR currency.
 * @param {number} amount
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date to a readable string.
 * @param {Date|string} date
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
};

/**
 * Build pagination metadata.
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Generate an invoice number based on current date and a count.
 * Format: PV-INV-YYYYMMDD-COUNT
 * @param {number} count - Sequential number
 * @param {Date|string} invoiceDate - The date of the invoice
 * @returns {string} Invoice number
 */
const generateInvoiceNo = (count, invoiceDate = new Date()) => {
  const date = new Date(invoiceDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequential = String(count).padStart(3, '0');
  return `PV-INV-${year}${month}${day}-${sequential}`;
};

const generatePurchaseBillNo = (count) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequential = String(count).padStart(3, '0');
  return `PV-PUR-${year}${month}-${sequential}`;
};

module.exports = {
  formatCurrency,
  formatDate,
  buildPagination,
  generateInvoiceNo,
  generatePurchaseBillNo,
};
