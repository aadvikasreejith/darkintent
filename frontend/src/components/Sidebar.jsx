import { NavLink, Link } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import {
  IconDashboard,
  IconCompass,
  IconLayers,
  IconMail,
  IconBook,
  IconBarChart,
  IconBuilding,
  IconCalendar,
  IconClose,
  IconUser,
  IconRefresh
} from './Icons';

export function Sidebar({ isOpen, onClose }) {
  const {
    opportunities,
    meetings = [],
    productProfile,
    currentUser,
    backendStatus,
    checkBackend,
    resetToDefaultData
  } = useOpportunities();

  const activePipelineCount = opportunities.filter((o) => o.pipelineStage !== 'Won/Lost').length;
  const highIntentCount = opportunities.filter((o) => o.score >= 90).length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status === 'Confirmed' || m.status === 'Proposed').length;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    {
      to: '/opportunities',
      label: 'Opportunities',
      icon: IconBuilding,
      badge: `${activePipelineCount}`
    },
    {
      to: '/discover',
      label: 'Discover',
      icon: IconCompass,
      badge: highIntentCount ? `${highIntentCount} high` : null,
      badgeType: 'badge-high'
    },
    { to: '/outreach', label: 'Outreach', icon: IconMail },
    { to: '/pipeline', label: 'Pipeline', icon: IconLayers },
    {
      to: '/meetings',
      label: 'Meetings',
      icon: IconCalendar,
      badge: upcomingMeetingsCount ? `${upcomingMeetingsCount}` : null
    },
    { to: '/knowledge', label: 'Knowledge Base', icon: IconBook },
    { to: '/analytics', label: 'Analytics', icon: IconBarChart }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand-lockup" onClick={onClose}>
            <div className="brand-mark-dark">
              <span className="brand-dot-pulse"></span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h5l3-7 4 14 3-7h5" />
              </svg>
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name-dark">DarkIntent</span>
              <span className="brand-sub-tag">B2B Intelligence</span>
            </div>
          </Link>
          {isOpen && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <IconClose size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="sidebar-section-header">Workspace</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'nav-item-active' : ''}`
                }
                onClick={onClose}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={16} />
                </span>
                <span className="sidebar-nav-text">{item.label}</span>
                {item.badge && (
                  <span className={`sidebar-badge ${item.badgeType || ''}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Compact Product Profile & Settings Area */}
        <div className="sidebar-footer">
          <div className="profile-settings-card">
            <div className="profile-card-top">
              <div className="profile-avatar">
                <IconUser size={13} />
              </div>
              <div className="profile-info">
                <span className="profile-user-name">
                  {currentUser?.name || 'Arjun Mehta'}
                </span>
                <span className="profile-product-tag">
                  {productProfile?.productName || 'Cloud security software'}
                </span>
              </div>
            </div>

            <div className="profile-meta-row">
              <span className="profile-market-pill">
                Market: {productProfile?.targetMarket || 'India'}
              </span>
              <Link
                to="/onboarding"
                className="profile-edit-link"
                onClick={onClose}
                title="Edit your product profile"
              >
                Edit
              </Link>
            </div>

            <div className="sidebar-backend-status">
              <span
                className={`backend-dot ${backendStatus.isOnline ? 'dot-online' : 'dot-offline'}`}
              />
              <span className="backend-text">
                {backendStatus.isOnline ? 'Live API :8000' : 'Backend Offline'}
              </span>
              <button
                type="button"
                className="sidebar-btn-ping"
                onClick={checkBackend}
                disabled={backendStatus.checking}
                title="Ping Python backend on http://localhost:8000"
              >
                <IconRefresh size={11} className={backendStatus.checking ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <div className="sidebar-reset-row">
            <button
              type="button"
              className="btn-link-subtle text-xs"
              onClick={resetToDefaultData}
              title="Reset sample opportunities"
            >
              Reset sample data
            </button>
            <Link to="/" className="btn-link-subtle text-xs" onClick={onClose}>
              Overview
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
