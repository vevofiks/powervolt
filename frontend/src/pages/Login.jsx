import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineLockClosed, HiOutlineUser, HiLightningBolt } from 'react-icons/hi';
import { authApi } from '../api/auth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const { token, username: loggedInUser } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('username', loggedInUser);
      
      toast.success('Welcome back, Admin!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
      </div>
      
      <div className="login-card-container">
        <div className="login-logo-container">
          <div className="login-logo-icon">
            <HiLightningBolt />
          </div>
          <span className="login-logo-text">POWER VOLT</span>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2>Admin Portal</h2>
            <p>Access the control center and manage inventory, invoices, accounts, and workforce.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="username">Username</label>
              <div className="login-input-wrapper">
                <HiOutlineUser className="input-icon" />
                <input
                  type="text"
                  id="username"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrapper">
                <HiOutlineLockClosed className="input-icon" />
                <input
                  type="password"
                  id="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <div className="login-spinner"></div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>&copy; {new Date().getFullYear()} Power Volt Engineering. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
