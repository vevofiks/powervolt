import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { settingApi } from '../../api/settings';
import logo from '../../assets/logo.png';
import stamp from '../../assets/official_stamp.jpg';
import './InvoicePrint.css';

export default function InvoicePrint({ invoice }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingApi.get().then(res => setSettings(res.data));
  }, []);

  if (!invoice) return null;
  const items = invoice.items || [];

  // Calculate taxes if GST
  const isGst = invoice.invoiceType === 'GST';
  const taxAmount = invoice.taxAmount || 0;
  const cgst = isGst ? (taxAmount / 2) : 0;
  const sgst = isGst ? (taxAmount / 2) : 0;


  return (
    <div className="invoice-print-container">
      <div className="invoice-outer-border">
        {/* Header Section */}
        <div className="invoice-header">
          <div className="header-left">
            <img src={logo} alt="Power Volt Logo" className="logo" />
            <h1 className="company-name">{settings?.companyName || 'Power Volt'}</h1>
            <div className="company-info">
              <p>{settings?.companyAddress || '595-B, Amajoor (PO), Krakkunnu, Manjeri, Malappuram (Dist), 676122'}</p>
              <p>GSTIN : {settings?.companyGstin || '32AANAPL6617R1ZO'}</p>
              <p>PAN : {settings?.companyPan || 'ANAPL6617R'}</p>
              <p>Contact No : {settings?.companyPhone || '9567965664'}</p>
            </div>
          </div>
          <div className="header-right">
            <h2 className="invoice-type-title">TAX INVOICE</h2>
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td className="label">DATE</td>
                  <td className="value">{formatDate(invoice.date)}</td>
                </tr>
                <tr>
                  <td className="label">INVOICE #</td>
                  <td className="value">{invoice.invoiceNo}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Section */}
        <div className="bill-to-section">
          <div className="bill-to-header">BILL TO</div>
          <div className="bill-to-details">
            <strong>{invoice.customerName}</strong>
            {invoice.customerAddress1 && <p>{invoice.customerAddress1}</p>}
            {invoice.customerAddress2 && <p>{invoice.customerAddress2}</p>}
            <p>{invoice.customerCity}{invoice.customerCity && invoice.customerState ? ', ' : ''}{invoice.customerState} {invoice.customerPincode}</p>
            {invoice.customerPhone && <p>PHON : {invoice.customerPhone}</p>}
            {invoice.customerGstin && <p>GSTIN : {invoice.customerGstin}</p>}
            <p>STATE NAME : {invoice.customerState || 'KERALA'} CODE 32</p>
          </div>
        </div>

        {/* Product Table */}
        <div className="items-table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th width="30%">PRODUCT / SERVICE</th>
                <th width="12%">HSN</th>
                <th width="33%">DESCRIPTION</th>
                <th width="5%">QTY</th>
                <th width="10%">Price</th>
                <th width="10%">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="font-semibold">{item.productName}</td>
                  <td className="col-center">{item.hsnCode || '—'}</td>
                  <td>{item.description || item.productName}</td>
                  <td className="col-center">{item.qty}</td>
                  <td className="col-right">₹ {item.rate.toFixed(2)}</td>
                  <td className="col-right">₹ {item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="summary-container" style={{ marginTop: '20px' }}>
          <table className="totals-table">
            <tbody>
              <tr>
                <td className="label">Subtotal</td>
                <td className="value">₹ {invoice.subtotal.toFixed(2)}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr>
                  <td className="label">Discount</td>
                  <td className="value">- ₹ {invoice.discount.toFixed(2)}</td>
                </tr>
              )}
              {isGst && (
                <>
                  <tr>
                    <td className="label">CGST @ 9%</td>
                    <td className="value">₹ {cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="label">SGST @ 9%</td>
                    <td className="value">₹ {sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="label">CESS</td>
                    <td className="value">₹ 0.00</td>
                  </tr>
                </>
              )}
              <tr className="grand-total-row">
                <td className="label">TOTAL</td>
                <td className="value">₹ {invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Section */}
        <div className="invoice-bottom">
          <div className="bank-details">
            <h4>Bank Details</h4>
            <p>Bank : {invoice.account?.bankName || 'Federal Bank - Manjeri'}</p>
            <p>Name : {invoice.account?.accountName || 'POWER VOLT'}</p>
            <p>Acc No : {invoice.account?.accountNumber || '13650200030606'}</p>
            <p>IFSC : {invoice.account?.ifscCode || 'FDRL0001365'}</p>
            <p>PAN : {settings?.companyPan || 'ANAPL6617R'}</p>
          </div>
          
          <div className="seal-area" style={{ position: 'relative' }}>
            <img src={stamp} alt="Official Stamp" className="seal-img" style={{ 
              borderRadius: '50%', 
              width: '120px',
              height: '120px',
              opacity: '0.85',
              transform: 'rotate(-3deg)' 
            }} />
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>Authorized By</p>
              <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>Lukmanul Hakeem M</p>
            </div>
          </div>

          <div className="signature-area">
            <p>Authorized Signatory</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="invoice-footer-note">
          Thank You For Your Business!
        </div>
      </div>
    </div>
  );
}
