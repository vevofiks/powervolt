import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, APP_NAME } from '../../utils/constants';
import { HiOutlineX, HiOutlineLightningBolt, HiOutlineLogout } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    toast.success('Logged out successfully');
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__logo-container">
            <img src="/logo.svg" alt="Power Volt Logo" className="sidebar__logo-img" />
          </div>
          <span className="sidebar__brand-name">{APP_NAME}</span>
          <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
            <HiOutlineX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                onClick={onClose}
                id={`nav-${item.path.replace('/', '') || 'dashboard'}`}
              >
                <Icon className="sidebar__link-icon" />
                <span className="sidebar__link-label">{item.label}</span>
                {isActive && <div className="sidebar__link-indicator" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <button 
            onClick={handleLogout} 
            className="sidebar__logout-btn"
            id="nav-logout"
          >
            <HiOutlineLogout className="sidebar__link-icon" />
            <span>Logout</span>
          </button>
          
          <div className="sidebar__footer-badge">
            <HiOutlineLightningBolt />
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

