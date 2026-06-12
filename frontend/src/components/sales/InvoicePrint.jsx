import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { settingApi } from '../../api/settings';
import stamp from '../../assets/official_stamp.jpg';
import './InvoicePrint.css';

/**
 * Convert a number to Indian currency words
 */
function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertChunk(n % 100) : '');
  }

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  let result = '';
  if (intPart >= 10000000) {
    result += convertChunk(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  const rem1 = intPart % 10000000;
  if (rem1 >= 100000) {
    result += convertChunk(Math.floor(rem1 / 100000)) + ' Lakh ';
  }
  const rem2 = rem1 % 100000;
  if (rem2 >= 1000) {
    result += convertChunk(Math.floor(rem2 / 1000)) + ' Thousand ';
  }
  const rem3 = rem2 % 1000;
  if (rem3 > 0) {
    result += convertChunk(rem3);
  }

  result = result.trim() || 'Zero';
  if (decPart > 0) {
    result += ' and ' + convertChunk(decPart) + ' Paise';
  }
  return result + ' Only';
}

export default function InvoicePrint({ invoice }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingApi.get().then(res => setSettings(res.data));
  }, []);

  if (!invoice) return null;
  const items = invoice.items || [];

  const isGst = invoice.invoiceType === 'GST';
  const taxAmount = invoice.taxAmount || 0;
  const cgst = isGst ? (taxAmount / 2) : 0;
  const sgst = isGst ? (taxAmount / 2) : 0;
  const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);

  // Unified invoice title (no product/service prefix since bill can have both)
  const invoiceTitle = isGst ? 'TAX INVOICE' : 'INVOICE';
  const categoryColor = '#16a34a'; // consistent green brand color

  return (
    <div className="invoice-print-container">
      <div className="invoice-outer-border" style={{ borderColor: categoryColor }}>

        {/* ═══ Category Watermark ═══ */}
        <div className="invoice-watermark" style={{ color: categoryColor }}>
          SALES
        </div>

        {/* ═══ Header ═══ */}
        <div className="invoice-header">
          <div className="header-left">
            <img src="/logo.svg" alt="Power Volt Logo" className="logo" />
            <h1 className="company-name">{settings?.companyName || 'POWER VOLT'}</h1>
            <div className="company-tagline">Electrical Engineering & Services</div>
            <div className="company-info">
              <p>{settings?.companyAddress || '595-B, Amayoor, Karakunnu, Kammadagi Padi, Manjeri, Malappuram, Kerala - 676123'}</p>
              <p>GSTIN: {settings?.companyGstin || '32ANAPL6617R1ZO'} &nbsp;|&nbsp; PAN: {settings?.companyPan || 'ANAPL6617R'}</p>
              <p>Contact: {settings?.companyPhone || '9567965664'}</p>
            </div>
          </div>
          <div className="header-right">
            <h2
              className="invoice-type-title"
              style={{ color: categoryColor }}
            >
              {invoiceTitle}
            </h2>
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td className="meta-label">Invoice #</td>
                  <td className="meta-value">{invoice.invoiceNo}</td>
                </tr>
                <tr>
                  <td className="meta-label">Date</td>
                  <td className="meta-value">{formatDate(invoice.date)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="header-divider" style={{ background: categoryColor }} />

        {/* ═══ Bill To ═══ */}
        <div className="bill-to-section">
          <div className="bill-to-header" style={{ background: categoryColor }}>BILL TO</div>
          <div className="bill-to-details">
            <strong className="bill-to-name">{invoice.customerName}</strong>
            {invoice.customerAddress1 && <p>{invoice.customerAddress1}</p>}
            {invoice.customerAddress2 && <p>{invoice.customerAddress2}</p>}
            <p>
              {invoice.customerCity}{invoice.customerCity && invoice.customerState ? ', ' : ''}
              {invoice.customerState} {invoice.customerPincode}
            </p>
            {invoice.customerPhone && <p>Phone: {invoice.customerPhone}</p>}
            {invoice.customerGstNumber && <p>GSTIN: {invoice.customerGstNumber}</p>}
            <p>State: {invoice.customerState || 'KERALA'}, Code: 32</p>
          </div>
        </div>

        {/* ═══ Items Table ═══ */}
        <div className="items-table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr style={{ background: categoryColor }}>
                <th className="col-sl">Sl</th>
                <th className="col-product">Name / Description</th>
                <th className="col-hsn">HSN Code</th>
                <th className="col-qty">Qty</th>
                <th className="col-rate">Rate</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="col-center">{index + 1}</td>
                  <td className="col-product-name">
                    <span className="product-name-text">{item.productName}</span>
                  </td>
                  <td className="col-center">{item.hsnCode || '—'}</td>
                  <td className="col-center">{item.qty}</td>
                  <td className="col-right">₹{Number(item.rate).toFixed(2)}</td>
                  <td className="col-right">₹{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
              {/* Totals row inside table */}
              <tr className="items-total-row">
                <td></td>
                <td className="items-total-label">Total</td>
                <td></td>
                <td className="col-center total-qty">{totalQty}</td>
                <td></td>
                <td className="col-right total-amount">₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ═══ Summary + Amount in Words ═══ */}
        <div className="invoice-summary-section">
          <div className="amount-words-box">
            <span className="words-label">Amount in Words:</span>
            <span className="words-value">{numberToWords(invoice.totalAmount)}</span>
          </div>
          <div className="totals-box">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td className="label">Subtotal</td>
                  <td className="value">₹{invoice.subtotal.toFixed(2)}</td>
                </tr>
                {invoice.discount > 0 && (
                  <tr>
                    <td className="label">Discount</td>
                    <td className="value">- ₹{invoice.discount.toFixed(2)}</td>
                  </tr>
                )}
                {isGst && (
                  <>
                    <tr>
                      <td className="label">CGST @ 9%</td>
                      <td className="value">₹{cgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="label">SGST @ 9%</td>
                      <td className="value">₹{sgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="label" style={{ color: '#64748b', fontSize: '10px' }}>Total GST</td>
                      <td className="value" style={{ fontSize: '10px' }}>₹{taxAmount.toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr className="grand-total-row">
                  <td className="label" style={{ color: categoryColor }}>TOTAL</td>
                  <td className="value" style={{ color: categoryColor }}>₹{invoice.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ Bottom: Bank Details + Stamp + Signature ═══ */}
        <div className="invoice-bottom-section">
          {/* Column 1: Bank Details */}
          <div className="bank-details">
            <h4>Bank Details</h4>
            <p>Bank: {invoice.account?.bankName || 'Federal Bank - Manjeri'}</p>
            <p>Name: {invoice.account?.accountName || 'POWER VOLT'}</p>
            <p>A/C No: {invoice.account?.accountNumber || '13650200030606'}</p>
            <p>IFSC: {invoice.account?.ifscCode || 'FDRL0001365'}</p>
            <p>PAN: {settings?.companyPan || 'ANAPL6617R'}</p>
          </div>



          {/* Column 3: Stamp & Signature */}
          <div className="signature-area">
            <div className="seal-area">
              <img src={stamp} alt="Official Stamp" className="seal-img" />
            </div>
            <div className="signature-line"></div>
            <p>Authorized Signatory</p>
          </div>
        </div>

        {/* ═══ Terms & Footer ═══ */}
        {invoice.notes && (
          <div className="invoice-notes">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        <div className="invoice-footer-note" style={{ color: categoryColor }}>
          Thank You For Your Business!
        </div>
      </div>
    </div>
  );
}
