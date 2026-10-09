import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="minimal-landing">
      {/* Top Bar with Wordmark & Discreet Flow Links */}
      <header className="minimal-landing-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-dot" />
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12h5l3-7 4 14 3-7h5" />
            </svg>
          </div>
          <span className="brand-name font-editorial">DarkIntent</span>
        </div>

        <nav className="minimal-landing-nav" aria-label="Access">
          <Link to="/login" className="minimal-subtle-link">
            Sign in
          </Link>
          <Link to="/onboarding" className="minimal-subtle-link">
            Setup
          </Link>
        </nav>
      </header>

      {/* Centered Minimal Action with Generous Empty Space */}
      <main className="minimal-landing-main">
        <div className="minimal-accent-glyph" aria-hidden="true" />
        <Link to="/dashboard" className="btn-enter-dashboard">
          <span>Enter Dashboard</span>
          <span className="arrow-sym">&rarr;</span>
        </Link>
      </main>
    </div>
  );
}
