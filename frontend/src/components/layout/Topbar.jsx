import { HiOutlineMenu, HiOutlineBell } from 'react-icons/hi';
import SearchBar from '../ui/SearchBar';
import './Topbar.css';

export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar" id="topbar">
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <HiOutlineMenu />
        </button>
        <SearchBar />
      </div>

      <div className="topbar__right">
        <button className="topbar__icon-btn" aria-label="Notifications" id="btn-notifications">
          <HiOutlineBell />
          <span className="topbar__badge">3</span>
        </button>
        <div className="topbar__avatar" id="user-avatar">
          <span>PV</span>
        </div>
      </div>
    </header>
  );
}
