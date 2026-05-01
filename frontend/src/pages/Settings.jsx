import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { settingApi } from '../api/settings';
import { HiOutlineSave, HiOutlineOfficeBuilding, HiOutlineCog, HiOutlineDatabase, HiOutlineDownload } from 'react-icons/hi';
import './Settings.css';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyGstin: '',
    invoicePrefix: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingApi.get();
      setFormData(res.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingApi.update(formData);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await settingApi.backup();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `powervolt_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('Backup downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  if (loading) return <div className="page-wrapper"><LoadingSkeleton count={2} height={200} /></div>;

  return (
    <div className="settings-page">
      <PageHeader title="Settings" subtitle="Configure your company profile and application preferences" />

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-grid">
          {/* Company Profile */}
          <Card title="Company Profile" icon={HiOutlineOfficeBuilding}>
            <div className="form-grid">
              <Input 
                label="Company Name" 
                required
                value={formData.companyName} 
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              />
              <Input 
                label="GST Number" 
                placeholder="22AAAAA0000A1Z5"
                value={formData.companyGstin} 
                onChange={(e) => setFormData(prev => ({ ...prev, companyGstin: e.target.value }))}
              />
              <Input 
                label="Phone Number" 
                value={formData.companyPhone} 
                onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
              />
              <Input 
                label="Email Address" 
                type="email"
                value={formData.companyEmail} 
                onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
              />
              <div className="full-width">
                <Input 
                  label="Business Address" 
                  placeholder="Street, City, State, ZIP"
                  value={formData.companyAddress} 
                  onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          {/* App Configuration */}
          <Card title="Invoice Configuration" icon={HiOutlineCog}>
            <div className="form-grid">
              <Input 
                label="Invoice Prefix" 
                placeholder="PV"
                value={formData.invoicePrefix} 
                onChange={(e) => setFormData(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                helperText="Appended to every invoice number (e.g., PV-INV-001)"
              />
              <Input 
                label="Currency" 
                value="INR (₹)" 
                disabled 
                helperText="Fixed for current region"
              />
            </div>
          </Card>

          {/* Backup & Data */}
          <Card title="Data Management" icon={HiOutlineDatabase}>
            <div className="data-management-box">
              <div className="data-info">
                <h4>Backup & Export</h4>
                <p>Download a complete snapshot of your accounts, inventory, and transaction history as a JSON file.</p>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleBackup}
                loading={isBackingUp}
                icon={HiOutlineDownload}
              >
                Download Full Backup
              </Button>
            </div>
          </Card>
        </div>

        <div className="settings-actions">
          <Button type="submit" loading={submitting} icon={HiOutlineSave} size="lg">
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
