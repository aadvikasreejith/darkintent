import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { PIPELINE_STAGES, formatINR } from '../data/sampleData';
import { ScoreBadge } from '../components/ScoreBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  LogoGitHub,
  LogoReddit,
  LogoHackerNews,
  LogoStackOverflow,
  LogoLinkedIn,
  IconSearch,
  IconFilter,
  IconClose,
  IconBookmark,
  IconBookmarkFilled,
  IconExternalLink,
  IconMail,
  IconCopy,
  IconCheck,
  IconArrowRight,
  IconCalendar,
  IconDownload,
  IconRefresh
} from '../components/Icons';

// Concise problem title formatter for scannable cards
function getConciseCardTitle(title) {
  if (!title) return '';
  const conciseMap = {
    'PostgreSQL connection exhaustion under load (Prisma + PgBouncer failure)':
      'PostgreSQL Connection Pool Saturation under Morning Spikes',
    'Milvus / pgvector indexing OOM crashes on 50M+ 1536-dim embeddings':
      'Milvus & pgvector Indexing OOM Crashes on 50M Embeddings',
    'Snowflake credit runaway and dbt warehouse lockup on 8TB transaction ledger':
      'Snowflake Credit Runaway & Warehouse Lockup on 8TB Ledger',
    '504 Gateway Timeouts and Envoy TLS saturation on AWS EKS ingress controller':
      '504 Gateway Timeouts & Envoy TLS Saturation on AWS EKS',
    'Kafka consumer lag spikes and rebalance storm during partition reassignment':
      'Kafka Consumer Lag Spikes & Rebalance Storm',
    'Cilium eBPF network policy audit failures in multi-tenant Kubernetes':
      'Cilium eBPF Network Policy Audit Failures in Kubernetes',
    'Redis memory fragmentation and OOM evictions during vector cache surge':
      'Redis Memory Fragmentation & Cache Evictions under Load',
    'Elasticsearch cluster red status and unassigned shards after node recovery':
      'Elasticsearch Red Cluster Status & Unassigned Shards'
  };
  if (conciseMap[title]) return conciseMap[title];
  const cleaned = title.replace(/\s*\([^)]*\)/g, '').replace(/,\s*causing.*$/i, '');
  const words = cleaned.split(/\s+/);
  if (words.length <= 8) return cleaned;
  return words.slice(0, 7).join(' ');
}

export function OpportunitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    opportunities,
    updateOpportunityStage,
    evaluateRelevance,
    exportOpportunitiesCsv,
    syncBackendSignals,
    isDiscoveringLive,
    showToast
  } = useOpportunities();

  // Selected opportunity ID derived directly from URL query param
  const selectedOppId = searchParams.get('selected') || null;

  // Search, filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [sortBy, setSortBy] = useState('score-desc');

  // Bookmarked opportunities stored in localStorage
  const [savedOppIds, setSavedOppIds] = useState(() => {
    try {
      const stored = localStorage.getItem('darkintent_saved_opps');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Floating panel active tab state
  const [panelTab, setPanelTab] = useState('overview'); // 'overview', 'company', 'discussion', 'outreach'
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleClosePanel = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleOpenPanel = useCallback((oppId) => {
    setPanelTab('overview');
    setSearchParams({ selected: oppId });
  }, [setSearchParams]);

  // Handle escape key to close floating panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedOppId) {
        handleClosePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOppId, handleClosePanel]);

  const toggleBookmark = (e, oppId) => {
    e.stopPropagation();
    setSavedOppIds((prev) => {
      const isBookmarked = prev.includes(oppId);
      const next = isBookmarked ? prev.filter((id) => id !== oppId) : [...prev, oppId];
      try {
        localStorage.setItem('darkintent_saved_opps', JSON.stringify(next));
      } catch {
        // no-op
      }
      showToast(isBookmarked ? 'Opportunity removed from bookmarks.' : 'Opportunity saved to bookmarks.', 'info');
      return next;
    });
  };

  // Collect unique technologies
  const allTechnologies = useMemo(() => {
    const set = new Set();
    opportunities.forEach((o) => {
      (o.technologies || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [opportunities]);

  // Filtering & Sorting
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = (opp.company || '').toLowerCase().includes(q);
          const matchTitle = (opp.title || '').toLowerCase().includes(q);
          const matchSummary = (opp.problemSummary || '').toLowerCase().includes(q);
          const matchLocation = (opp.location || '').toLowerCase().includes(q);
          const matchTech = (opp.technologies || []).some((t) => t.toLowerCase().includes(q));
          if (!matchCompany && !matchTitle && !matchSummary && !matchTech && !matchLocation) {
            return false;
          }
        }

        if (selectedSource !== 'All' && !opp.source.toLowerCase().includes(selectedSource.toLowerCase())) {
          return false;
        }

        if (selectedTech !== 'All' && !(opp.technologies || []).includes(selectedTech)) {
          return false;
        }

        if (selectedSeverity !== 'All' && opp.severity.toLowerCase() !== selectedSeverity.toLowerCase()) {
          return false;
        }

        if (selectedStage !== 'All' && opp.pipelineStage !== selectedStage) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.score - a.score;
        if (sortBy === 'score-asc') return a.score - b.score;
        if (sortBy === 'severity') {
          const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (rank[b.severity] || 0) - (rank[a.severity] || 0);
        }
        return 0;
      });
  }, [opportunities, searchQuery, selectedSource, selectedTech, selectedSeverity, selectedStage, sortBy]);

  const activeFiltersCount =
    (selectedSource !== 'All' ? 1 : 0) +
    (selectedTech !== 'All' ? 1 : 0) +
    (selectedSeverity !== 'All' ? 1 : 0) +
    (selectedStage !== 'All' ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSource('All');
    setSelectedTech('All');
    setSelectedSeverity('All');
    setSelectedStage('All');
    setSortBy('score-desc');
    setShowFiltersMenu(false);
  };

  // Find active opportunity object for floating panel
  const activeOpp = useMemo(() => {
    if (!selectedOppId) return null;
    return opportunities.find((o) => o.id === selectedOppId) || null;
  }, [opportunities, selectedOppId]);

  const activeRelevance = useMemo(() => {
    if (!activeOpp) return null;
    return evaluateRelevance(activeOpp);
  }, [activeOpp, evaluateRelevance]);

  const getSourceLogo = (sourceName) => {
    const s = sourceName.toLowerCase();
    if (s.includes('github')) return <LogoGitHub size={16} />;
    if (s.includes('reddit')) return <LogoReddit size={16} />;
    if (s.includes('hacker') || s.includes('hn')) return <LogoHackerNews size={16} />;
    if (s.includes('stack')) return <LogoStackOverflow size={16} />;
    if (s.includes('linkedin')) return <LogoLinkedIn size={16} />;
    return <LogoGitHub size={16} />;
  };

  const handleCopyPanelExcerpt = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedExcerpt(true);
    showToast('Original technical excerpt copied.', 'success');
    setTimeout(() => setCopiedExcerpt(false), 2000);
  };

  const handleCopyPanelSummary = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    showToast('Problem summary copied.', 'success');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="opportunities-workspace">
      {/* PART 2A: Page Header & Clean Controls */}
      <header className="opps-page-header">
        <div className="opps-header-title-block">
          <div className="opps-heading-line">
            <h1 className="opps-main-title font-editorial">Opportunities</h1>
            <span className="opps-count-badge font-mono">
              {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'signal' : 'signals'}
            </span>
          </div>
          <p className="opps-main-subtitle">Signals worth a closer look.</p>
        </div>

        {/* Clean Search, Single Filters Control & Sort */}
        <div className="opps-controls-bar">
          {/* Clean Search Field */}
          <div className="opps-search-box">
            <IconSearch size={15} className="opps-search-icon" />
            <input
              type="text"
              className="opps-search-input"
              placeholder="Search company, problem, city, or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search opportunities"
            />
            {searchQuery && (
              <button
                type="button"
                className="opps-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                <IconClose size={13} />
              </button>
            )}
          </div>

          {/* ONE Filters Control */}
          <div className="opps-filters-menu-wrap">
            <button
              type="button"
              className={`opps-filters-btn ${activeFiltersCount > 0 ? 'filters-btn-active' : ''}`}
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              aria-expanded={showFiltersMenu}
              aria-label="Open filter options"
            >
              <IconFilter size={14} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filters-count-pill">{activeFiltersCount}</span>
              )}
            </button>

            {/* Dropdown Filters Menu (Hidden by default to reduce clutter) */}
            {showFiltersMenu && (
              <div className="opps-filters-flyout card-panel">
                <div className="flyout-header">
                  <span className="flyout-title font-medium">Filter Signals</span>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      className="flyout-reset-link"
                      onClick={clearAllFilters}
                    >
                      Reset all
                    </button>
                  )}
                </div>

                <div className="flyout-filter-group">
                  <label className="flyout-label">Source Platform</label>
                  <select
                    className="flyout-select"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                  >
                    <option value="All">All Sources</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Reddit">Reddit</option>
                    <option value="Stack Overflow">Stack Overflow</option>
                    <option value="Hacker News">Hacker News</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>

                <div className="flyout-filter-group">
                  <label className="flyout-label">Technology</label>
                  <select
                    className="flyout-select"
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                  >
                    <option value="All">All Technologies</option>
                    {allTechnologies.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flyout-filter-group">
                  <label className="flyout-label">Severity</label>
                  <select
                    className="flyout-select"
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                  >
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flyout-filter-group">
                  <label className="flyout-label">Pipeline Stage</label>
                  <select
                    className="flyout-select"
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                  >
                    <option value="All">All Stages</option>
                    {PIPELINE_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flyout-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-xs w-full"
                    onClick={() => setShowFiltersMenu(false)}
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simple Sort Option & Export CSV */}
          <div className="opps-sort-wrap">
            <select
              className="opps-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort opportunities"
            >
              <option value="score-desc">Highest score</option>
              <option value="severity">Critical severity</option>
              <option value="score-asc">Lowest score</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={syncBackendSignals}
            disabled={isDiscoveringLive}
            title="Retrieve fresh live technical signals from external APIs"
          >
            <IconRefresh size={13} className={isDiscoveringLive ? 'spin' : ''} />
            <span>{isDiscoveringLive ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={exportOpportunitiesCsv}
            title="Download opportunities as CSV"
          >
            <IconDownload size={13} />
            <span>CSV</span>
          </button>
        </div>
      </header>

      {/* PART 2B: Spacious, Vertically Stacked Opportunity Cards */}
      <main className="opps-cards-stack" role="list">
        {filteredOpportunities.length === 0 ? (
          <div className="opps-empty-notice card-panel">
            <h3 className="font-editorial">No matching signals found</h3>
            <p>Try clearing your active search query or resetting filters.</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearAllFilters}
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredOpportunities.map((opp) => {
            const isSaved = savedOppIds.includes(opp.id);
            const isSelected = selectedOppId === opp.id;
            const conciseTitle = getConciseCardTitle(opp.title);

            return (
              <article
                key={opp.id}
                className={`opp-stacked-card ${isSelected ? 'card-active-selected' : ''}`}
                onClick={() => handleOpenPanel(opp.id)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpenPanel(opp.id);
                }}
              >
                {/* Top Row: Severity, Source, Recency & Bookmark */}
                <div className="card-top-header">
                  <div className="card-top-left-meta">
                    <SeverityBadge severity={opp.severity} />
                    <span className="card-sep">•</span>
                    <span className="card-source-tag">
                      {getSourceLogo(opp.source)}
                      <span>{opp.source}</span>
                    </span>
                    <span className="card-sep">•</span>
                    <span className="card-posted-time">{opp.postedAt}</span>
                  </div>

                  <div className="card-top-right-meta">
                    {/* Opportunity Score with Short Understandable Label */}
                    <div className="card-score-pill">
                      <ScoreBadge score={opp.score} size="small" />
                    </div>

                    {/* Bookmark / Save Control */}
                    <button
                      type="button"
                      className={`card-bookmark-btn ${isSaved ? 'bookmark-saved' : ''}`}
                      onClick={(e) => toggleBookmark(e, opp.id)}
                      title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                      aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
                    >
                      {isSaved ? (
                        <IconBookmarkFilled size={15} />
                      ) : (
                        <IconBookmark size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Problem Title (1-2 lines, clean concise typography) */}
                <h2 className="card-problem-title font-editorial">
                  {conciseTitle}
                </h2>

                {/* Company Name & Location */}
                <div className="card-account-line">
                  <strong className="card-company-name">{opp.company || opp.sourceIdentifier || 'Community Discussion'}</strong>
                  {opp.location && (
                    <span className="card-company-location">· {opp.location}</span>
                  )}
                  {opp.industry && (
                    <span className="card-company-industry">· {opp.industry}</span>
                  )}
                </div>

                {/* Bottom Row: Up to 3 Tech Tags & Inspect Trigger */}
                <div className="card-bottom-footer">
                  <div className="card-tech-tags">
                    {(opp.technologies || []).slice(0, 3).map((t) => (
                      <span key={t} className="tech-tag tag-sm">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="card-cta-action">
                    <span className="card-view-text">Inspect signal</span>
                    <IconArrowRight size={13} className="card-view-arrow" />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* PART 3: Floating Opportunity Detail Panel (Right Drawer Workspace) */}
      {activeOpp && (
        <div
          className="floating-panel-backdrop"
          onClick={handleClosePanel}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="floating-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Navigation & Actions */}
            <div className="drawer-top-navbar">
              <div className="drawer-nav-left">
                <span className="drawer-source-identity">
                  {getSourceLogo(activeOpp.source)}
                  <strong>{activeOpp.source}</strong>
                  {activeOpp.sourceChannel && <span>· {activeOpp.sourceChannel}</span>}
                </span>
                <span className="drawer-sep">•</span>
                <span className="drawer-time-label">{activeOpp.postedAt}</span>
              </div>

              <div className="drawer-nav-right">
                <button
                  type="button"
                  className={`drawer-bookmark-btn ${savedOppIds.includes(activeOpp.id) ? 'bookmark-saved' : ''}`}
                  onClick={(e) => toggleBookmark(e, activeOpp.id)}
                  title="Bookmark opportunity"
                  aria-label="Bookmark opportunity"
                >
                  {savedOppIds.includes(activeOpp.id) ? (
                    <IconBookmarkFilled size={16} />
                  ) : (
                    <IconBookmark size={16} />
                  )}
                </button>

                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={handleClosePanel}
                  title="Close panel (Esc)"
                  aria-label="Close detail panel"
                >
                  <IconClose size={17} />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="drawer-scrollable-body">
              {/* Problem Title & Severity */}
              <div className="drawer-headline-block">
                <div className="drawer-severity-row">
                  <SeverityBadge severity={activeOpp.severity} />
                  <span className="drawer-stage-pill">{activeOpp.pipelineStage}</span>
                </div>
                <h2 className="drawer-title font-editorial">{activeOpp.title}</h2>
              </div>

              {/* Opportunity Score & Explanation */}
              <div className="drawer-score-panel">
                <div className="drawer-score-header">
                  <div className="drawer-score-number-group">
                    <ScoreBadge score={activeOpp.score} />
                    <span className="drawer-score-summary-tag">
                      {activeOpp.score >= 90 ? 'High Buying Intent' : 'Qualified Fit'}
                    </span>
                  </div>
                  {activeOpp.pipelineValue && (
                    <span className="drawer-pipeline-val font-mono">
                      {formatINR(activeOpp.pipelineValue, true)} ARR
                    </span>
                  )}
                </div>
                <p className="drawer-score-explanation">
                  {activeOpp.scoreExplanation ||
                    'Calculated based on technical distress markers, architecture criticality, and executive authority.'}
                </p>
              </div>

              {/* Technologies Tags */}
              <div className="drawer-tech-row">
                <span className="drawer-row-label">Detected stack:</span>
                <div className="drawer-tags-list">
                  {(activeOpp.technologies || []).map((tech) => (
                    <span key={tech} className="tech-tag tag-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4 Working Tabs: Overview, Company Match, Discussion, Outreach */}
              <div className="drawer-tabs-bar" role="tablist">
                <button
                  type="button"
                  className={`drawer-tab-btn ${panelTab === 'overview' ? 'tab-active' : ''}`}
                  onClick={() => setPanelTab('overview')}
                  role="tab"
                  aria-selected={panelTab === 'overview'}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`drawer-tab-btn ${panelTab === 'company' ? 'tab-active' : ''}`}
                  onClick={() => setPanelTab('company')}
                  role="tab"
                  aria-selected={panelTab === 'company'}
                >
                  Company Match
                </button>
                <button
                  type="button"
                  className={`drawer-tab-btn ${panelTab === 'discussion' ? 'tab-active' : ''}`}
                  onClick={() => setPanelTab('discussion')}
                  role="tab"
                  aria-selected={panelTab === 'discussion'}
                >
                  Discussion
                </button>
                <button
                  type="button"
                  className={`drawer-tab-btn ${panelTab === 'outreach' ? 'tab-active' : ''}`}
                  onClick={() => setPanelTab('outreach')}
                  role="tab"
                  aria-selected={panelTab === 'outreach'}
                >
                  Outreach
                </button>
              </div>

              {/* Tab 1: Overview */}
              {panelTab === 'overview' && (
                <div className="drawer-tab-content" role="tabpanel">
                  <div className="drawer-section-card">
                    <div className="section-head-line">
                      <h3 className="section-title">Technical Problem Summary</h3>
                      <button
                        type="button"
                        className="btn-copy-inline"
                        onClick={() => handleCopyPanelSummary(activeOpp.problemSummary)}
                      >
                        {copiedSummary ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="drawer-body-text">{activeOpp.problemSummary}</p>
                    {activeOpp.rootCause && (
                      <div className="drawer-root-cause-box">
                        <strong>Root Cause:</strong> {activeOpp.rootCause}
                      </div>
                    )}
                  </div>

                  {activeOpp.recommendedAction && (
                    <div className="drawer-section-card">
                      <h3 className="section-title">Recommended Next Action</h3>
                      <p className="drawer-body-text">{activeOpp.recommendedAction}</p>
                    </div>
                  )}

                  {activeRelevance && (
                    <div className="drawer-section-card relevance-match-card">
                      <div className="relevance-card-header">
                        <span className="relevance-category-pill font-mono">
                          Product Fit: {activeRelevance.category}
                        </span>
                        <strong className="relevance-score font-editorial">
                          {activeRelevance.relevanceScore}%
                        </strong>
                      </div>
                      <p className="drawer-body-text">{activeRelevance.rationale}</p>
                      {activeRelevance.matchingTerms?.length > 0 && (
                        <div className="relevance-terms-list mt-2">
                          <span className="terms-label">Keywords matched:</span>
                          {activeRelevance.matchingTerms.map((term) => (
                            <span key={term} className="relevance-term-pill">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Company Match */}
              {panelTab === 'company' && (
                <div className="drawer-tab-content" role="tabpanel">
                  <div className="drawer-section-card">
                    <h3 className="section-title">Account Profile</h3>
                    <div className="drawer-meta-grid">
                      <div className="meta-pair">
                        <span className="pair-label">Company Name:</span>
                        <strong className="pair-val">{activeOpp.company}</strong>
                      </div>
                      <div className="meta-pair">
                        <span className="pair-label">Location:</span>
                        <span className="pair-val">{activeOpp.location || 'India'}</span>
                      </div>
                      <div className="meta-pair">
                        <span className="pair-label">Industry:</span>
                        <span className="pair-val">{activeOpp.industry || 'Technology'}</span>
                      </div>
                      <div className="meta-pair">
                        <span className="pair-label">Company Size / Funding:</span>
                        <span className="pair-val">{activeOpp.companySize || 'Series B'}</span>
                      </div>
                      {activeOpp.companyMatch?.buyerPersona && (
                        <div className="meta-pair">
                          <span className="pair-label">Target Buyer Persona:</span>
                          <span className="pair-val">{activeOpp.companyMatch.buyerPersona}</span>
                        </div>
                      )}
                      {activeOpp.companyMatch?.targetContact && (
                        <div className="meta-pair">
                          <span className="pair-label">Recommended Contact:</span>
                          <strong className="pair-val">{activeOpp.companyMatch.targetContact}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signals Contributing to the Match: Evidence vs Inference */}
                  <div className="drawer-section-card">
                    <h3 className="section-title">Match Evidence & Verification</h3>
                    <div className="evidence-sections-wrapper">
                      <div className="evidence-sub-block">
                        <span className="evidence-sub-title text-forest">
                          Observed Public Evidence:
                        </span>
                        <ul className="evidence-items-list">
                          {(activeOpp.evidence || [
                            `Error trace detected on public ${activeOpp.source} thread`
                          ]).map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="evidence-sub-block mt-3">
                        <span className="evidence-sub-title text-muted">
                          Inferred Match Context (Sample Demo):
                        </span>
                        <p className="evidence-note">
                          Matched domain <code>{activeOpp.domain || 'company.in'}</code> based on engineering staff profiles and public package dependencies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Discussion */}
              {panelTab === 'discussion' && (
                <div className="drawer-tab-content" role="tabpanel">
                  <div className="drawer-section-card">
                    <div className="section-head-line">
                      <div className="discussion-source-meta">
                        <strong className="source-name">{activeOpp.source}</strong>
                        {activeOpp.author && <span>· by {activeOpp.author}</span>}
                      </div>

                      <div className="discussion-header-actions">
                        {activeOpp.sourceUrl && (
                          <a
                            href={activeOpp.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-source-outbound"
                          >
                            <span>Open original</span>
                            <IconExternalLink size={12} />
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn-copy-inline"
                          onClick={() => handleCopyPanelExcerpt(activeOpp.originalExcerpt)}
                        >
                          {copiedExcerpt ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          <span>{copiedExcerpt ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Distinct Dark Inset Panel for Captured Technical Excerpt */}
                    <div className="dark-inset-terminal-panel">
                      <div className="terminal-bar">
                        <span className="term-dot dot-red" />
                        <span className="term-dot dot-yellow" />
                        <span className="term-dot dot-green" />
                        <span className="term-title">Original Technical Discussion Excerpt</span>
                      </div>
                      <pre className="terminal-code">
                        <code>{activeOpp.originalExcerpt}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Outreach Preview */}
              {panelTab === 'outreach' && (
                <div className="drawer-tab-content" role="tabpanel">
                  <div className="drawer-section-card">
                    <h3 className="section-title">Consultative Draft Preview</h3>
                    <p className="drawer-sub-instruction">
                      Tailored peer-engineer outreach for {activeOpp.company}.
                    </p>

                    <div className="drawer-draft-preview-box">
                      <pre className="drawer-draft-text">
                        {activeOpp.outreachDrafts?.consultative ||
                          `Hi there,\n\nI noticed your team discussing ${activeOpp.title} on ${activeOpp.source}.\n\nWe built an architectural solution that mitigates this bottleneck.\n\nBest regards,\nArjun Mehta`}
                      </pre>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary w-full mt-3"
                      onClick={() => navigate(`/outreach/${activeOpp.id}`)}
                    >
                      <IconMail size={15} />
                      <span>Open in dedicated message editor →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions Footer */}
            <div className="drawer-footer-actions">
              <div className="drawer-footer-stage">
                <label htmlFor="drawer-stage-select" className="drawer-stage-label">Stage:</label>
                <select
                  id="drawer-stage-select"
                  className="drawer-stage-select"
                  value={activeOpp.pipelineStage}
                  onChange={(e) => updateOpportunityStage(activeOpp.id, e.target.value)}
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-footer-buttons">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(`/meetings?oppId=${activeOpp.id}`)}
                  title="Schedule meeting with prospect"
                >
                  <IconCalendar size={14} />
                  <span>Schedule meeting</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-compose-drawer"
                  onClick={() => navigate(`/outreach/${activeOpp.id}`)}
                >
                  <IconMail size={14} />
                  <span>Compose outreach</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
