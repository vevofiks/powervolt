import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { customerApi } from '../api/customers';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { HiOutlineArrowLeft, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineDocumentText, HiOutlineMail, HiOutlineUserCircle, HiOutlineCurrencyRupee } from 'react-icons/hi';
import { RiWhatsappLine } from 'react-icons/ri';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getById(id);
      setCustomer(res.data);
    } catch (err) {
      toast.error('Failed to load customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return <div className="page-wrapper"><LoadingSkeleton count={4} height={100} /></div>;
  if (!customer) return <div className="page-wrapper">Customer not found</div>;

  const invoiceColumns = [
    { key: 'invoiceNo', label: 'Invoice No', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'invoiceType', label: 'Type', render: (val) => <Badge variant={val === 'GST' ? 'primary' : 'secondary'}>{val}</Badge> },
    { key: 'totalAmount', label: 'Amount', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'id', label: 'Actions', align: 'right', render: (id) => (
      <Button size="sm" variant="secondary" onClick={() => navigate(`/sales-invoice`)}>View</Button>
    )},
  ];

  return (
    <div className="page-wrapper customer-details">
      <PageHeader 
        title={customer.name} 
        subtitle="Customer Profile & Transaction History"
        actionLabel="Back to List"
        actionIcon={HiOutlineArrowLeft}
        onAction={() => navigate('/customers')}
      />

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <Card className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--color-primary-bg)', borderRadius: '12px', color: 'var(--color-primary)', fontSize: '24px' }}>
              <HiOutlineDocumentText />
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Total Invoices</span>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{customer.stats.totalInvoices}</div>
            </div>
          </div>
        </Card>
        <Card className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--color-info-bg)', borderRadius: '12px', color: 'var(--color-info)', fontSize: '24px' }}>
              <HiOutlineCurrencyRupee />
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Total Sales</span>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(customer.stats.totalSalesAmount)}</div>
            </div>
          </div>
        </Card>
        <Card className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--color-success-bg)', borderRadius: '12px', color: 'var(--color-success)', fontSize: '24px' }}>
              <HiOutlineUserCircle />
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Customer Since</span>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{formatDate(customer.createdAt)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Column: Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Contact Information">
            <div className="detail-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HiOutlineUserCircle style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Contact Person</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{customer.contactPerson || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HiOutlinePhone style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Phone Number</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{customer.phone || 'N/A'}</div>
                </div>
              </div>
              {customer.whatsapp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <RiWhatsappLine style={{ color: '#25D366' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>WhatsApp</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{customer.whatsapp}</div>
                  </div>
                </div>
              )}
              {customer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HiOutlineMail style={{ color: 'var(--color-text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Email</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{customer.email}</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Badge variant="primary">GSTIN: {customer.gstin || 'No GST'}</Badge>
              </div>
            </div>
          </Card>

          <Card title="Address">
            <div style={{ display: 'flex', gap: '12px' }}>
              <HiOutlineLocationMarker style={{ color: 'var(--color-text-muted)', marginTop: '4px' }} />
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {customer.address1 && <div>{customer.address1}</div>}
                {customer.address2 && <div>{customer.address2}</div>}
                <div>{customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}</div>
                {customer.pincode && <div>Pin: {customer.pincode}</div>}
                {(!customer.address1 && !customer.city) && <span className="text-muted">No address provided</span>}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: History */}
        <Card title="Recent Invoices" padding={false}>
          <DataTable 
            columns={invoiceColumns} 
            data={customer.salesInvoices} 
            emptyMessage="No invoice history for this customer." 
          />
        </Card>
      </div>
    </div>
  );
}
