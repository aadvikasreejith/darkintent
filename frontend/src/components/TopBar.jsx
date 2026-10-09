import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { IconMenu, IconRefresh, IconCompass, IconMic } from './Icons';
import { VoiceAssistantModal } from './VoiceAssistantModal';

export function TopBar({ onOpenSidebar }) {
  const location = useLocation();
  const { backendStatus, checkBackend, opportunities } = useOpportunities();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const getPageMeta = (pathname) => {
    if (pathname === '/') {
      return { title: 'Product Overview', subtitle: 'Public technical signals converted to high-intent sales pipeline' };
    }
    if (pathname.startsWith('/dashboard')) {
      return { title: 'Signals Dashboard', subtitle: 'Real-time telemetry and commercial conversion metrics' };
    }
    if (pathname.startsWith('/opportunities')) {
      return { title: 'Opportunity Directory', subtitle: 'Target accounts matched with public technical intent' };
    }
    if (pathname.startsWith('/discover')) {
      return { title: 'Discover Technical Signals', subtitle: 'Indexed developer pain points across public engineering forums' };
    }
    if (pathname.startsWith('/opportunity/')) {
      return { title: 'Opportunity Deep-Dive', subtitle: 'Technical root cause, company match, intent score, and playbook' };
    }
    if (pathname.startsWith('/outreach')) {
      return { title: 'Outreach Composer', subtitle: 'Tailored consultative email drafts matched to technical problems' };
    }
    if (pathname.startsWith('/pipeline')) {
      return { title: 'Opportunity Pipeline', subtitle: 'Track and advance deals from discovery to meeting and won' };
    }
    if (pathname.startsWith('/meetings')) {
      return { title: 'Executive Meetings & Briefs', subtitle: 'Manage scheduled conversations, pre-call intelligence briefs, and post-call notes' };
    }
    if (pathname.startsWith('/knowledge')) {
      return { title: 'Product Knowledge Base', subtitle: 'Solution capability specs, ICP definitions, and matching rules' };
    }
    if (pathname.startsWith('/analytics')) {
      return { title: 'Market & Signal Analytics', subtitle: 'Volume trends, platform conversion, and recurring technology bottlenecks' };
    }
    return { title: 'DarkIntent', subtitle: 'Technical Signal Intelligence' };
  };

  const { title, subtitle } = getPageMeta(location.pathname);
  const criticalCount = opportunities.filter((o) => o.severity === 'Critical').length;

  return (
    <>
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar menu"
          >
            <IconMenu size={20} />
          </button>
          <div className="topbar-title-block">
            <h1 className="topbar-title">{title}</h1>
            <p className="topbar-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-ticker" title="Active signal intelligence telemetry">
            <span className="ticker-dot"></span>
            <span className="ticker-text">
              <strong>{opportunities.length} active signals</strong> indexed ({criticalCount} critical)
            </span>
          </div>

          <div className="topbar-backend-badge">
            <span
              className={`badge-dot ${backendStatus.isOnline ? 'dot-online' : 'dot-offline'}`}
            />
            <span className="badge-text">
              {backendStatus.isOnline ? 'API Connected' : 'Backend Offline'}
            </span>
            <button
              type="button"
              className="topbar-recheck-btn"
              onClick={checkBackend}
              title="Check backend on http://localhost:8000"
              disabled={backendStatus.checking}
            >
              <IconRefresh size={12} className={backendStatus.checking ? 'spin' : ''} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm topbar-voice-btn"
            onClick={() => setIsVoiceOpen(true)}
            title="DarkIntent Voice Co-Pilot"
          >
            <IconMic size={14} />
            <span>Voice Co-Pilot</span>
          </button>

          {location.pathname !== '/discover' && (
            <Link to="/discover" className="btn btn-outline btn-sm topbar-action-btn">
              <IconCompass size={14} />
              <span>Discover</span>
            </Link>
          )}
        </div>
      </header>

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </>
  );
}
