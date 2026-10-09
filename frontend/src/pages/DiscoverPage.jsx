import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { PIPELINE_STAGES } from '../data/sampleData';
import { ScoreBadge } from '../components/ScoreBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { SourceBadge } from '../components/SourceBadge';
import {
  IconSearch,
  IconFilter,
  IconMail,
  IconArrowRight,
  IconClose,
  IconTerminal
} from '../components/Icons';

export function DiscoverPage() {
  const { opportunities, updateOpportunityStage, showToast } = useOpportunities();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedMinScore, setSelectedMinScore] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedRecency, setSelectedRecency] = useState('All');
  const [sortBy, setSortBy] = useState('score-desc');

  // Collect unique technologies
  const allTechnologies = useMemo(() => {
    const set = new Set();
    opportunities.forEach((o) => {
      (o.technologies || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [opportunities]);

  // Filter & sort logic
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = opp.company.toLowerCase().includes(q);
          const matchTitle = opp.title.toLowerCase().includes(q);
          const matchSummary = opp.problemSummary.toLowerCase().includes(q);
          const matchExcerpt = (opp.originalExcerpt || '').toLowerCase().includes(q);
          const matchLocation = (opp.location || '').toLowerCase().includes(q);
          const matchTech = (opp.technologies || []).some((t) => t.toLowerCase().includes(q));
          if (!matchCompany && !matchTitle && !matchSummary && !matchExcerpt && !matchTech && !matchLocation) {
            return false;
          }
        }

        // Source
        if (selectedSource !== 'All' && !opp.source.toLowerCase().includes(selectedSource.toLowerCase())) {
          return false;
        }

        // Tech
        if (selectedTech !== 'All' && !(opp.technologies || []).includes(selectedTech)) {
          return false;
        }

        // Severity
        if (selectedSeverity !== 'All' && opp.severity.toLowerCase() !== selectedSeverity.toLowerCase()) {
          return false;
        }

        // Min Score
        if (selectedMinScore !== 'All') {
          const min = parseInt(selectedMinScore, 10);
          if (opp.score < min) return false;
        }

        // Pipeline stage
        if (selectedStage !== 'All' && opp.pipelineStage !== selectedStage) {
          return false;
        }

        // Recency
        if (selectedRecency !== 'All') {
          if (selectedRecency === 'today' && !opp.postedAt.includes('hours') && !opp.postedAt.includes('mins')) {
            return false;
          }
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
  }, [
    opportunities,
    searchQuery,
    selectedSource,
    selectedTech,
    selectedSeverity,
    selectedMinScore,
    selectedStage,
    selectedRecency,
    sortBy
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSource !== 'All' ||
    selectedTech !== 'All' ||
    selectedSeverity !== 'All' ||
    selectedMinScore !== 'All' ||
    selectedStage !== 'All' ||
    selectedRecency !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSource('All');
    setSelectedTech('All');
    setSelectedSeverity('All');
    setSelectedMinScore('All');
    setSelectedStage('All');
    setSelectedRecency('All');
    setSortBy('score-desc');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredOpportunities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `darkintent_signals_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${filteredOpportunities.length} signals as JSON`, 'success');
  };

  return (
    <div className="discover-page">
      {/* Intro Header */}
      <div className="page-header-intro">
        <div>
          <h1 className="page-title">Discover Signals</h1>
          <p className="page-subtitle">
            Live technical troubleshooting discussions indexed from public engineering channels.
          </p>
        </div>
        <div className="header-meta-actions">
          <span className="demo-notice-tag">Demo Stream</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportData}
            title="Export filtered records"
          >
            Export JSON ({filteredOpportunities.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="discover-toolbar card-panel">
        <div className="toolbar-search-row">
          <div className="search-input-wrap">
            <IconSearch size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search companies, technical root causes, stack traces (e.g. Postgres, OOM, Prisma, Cilium)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                <IconClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="filter-controls-row">
          <div className="filter-item">
            <label className="filter-label" htmlFor="disc-source">Source</label>
            <select
              id="disc-source"
              className="filter-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              <option value="All">All Sources</option>
              <option value="GitHub">GitHub</option>
              <option value="Reddit">Reddit</option>
              <option value="Stack Overflow">Stack Overflow</option>
              <option value="Hacker News">Hacker News</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label" htmlFor="disc-tech">Technology</label>
            <select
              id="disc-tech"
              className="filter-select"
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

          <div className="filter-item">
            <label className="filter-label" htmlFor="disc-sev">Severity</label>
            <select
              id="disc-sev"
              className="filter-select"
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

          <div className="filter-item">
            <label className="filter-label" htmlFor="disc-score">Min Score</label>
            <select
              id="disc-score"
              className="filter-select"
              value={selectedMinScore}
              onChange={(e) => setSelectedMinScore(e.target.value)}
            >
              <option value="All">All Scores</option>
              <option value="90">90+ (High Intent)</option>
              <option value="80">80+ (Qualified)</option>
              <option value="70">70+ (Emerging)</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label" htmlFor="disc-recency">Recency</label>
            <select
              id="disc-recency"
              className="filter-select"
              value={selectedRecency}
              onChange={(e) => setSelectedRecency(e.target.value)}
            >
              <option value="All">All Time</option>
              <option value="today">Past 24 Hours (IST)</option>
            </select>
          </div>

          <div className="filter-item sort-item">
            <label className="filter-label" htmlFor="disc-sort">Sort By</label>
            <select
              id="disc-sort"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="score-desc">Score (Highest First)</option>
              <option value="severity">Severity (Critical First)</option>
              <option value="score-asc">Score (Lowest First)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="active-filters-row">
            <span className="active-filters-label">Active filters:</span>
            {searchQuery && (
              <span className="filter-pill">
                Keyword: &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')}>×</button>
              </span>
            )}
            {selectedSource !== 'All' && (
              <span className="filter-pill">
                Source: {selectedSource}
                <button type="button" onClick={() => setSelectedSource('All')}>×</button>
              </span>
            )}
            {selectedTech !== 'All' && (
              <span className="filter-pill">
                Tech: {selectedTech}
                <button type="button" onClick={() => setSelectedTech('All')}>×</button>
              </span>
            )}
            {selectedSeverity !== 'All' && (
              <span className="filter-pill">
                Severity: {selectedSeverity}
                <button type="button" onClick={() => setSelectedSeverity('All')}>×</button>
              </span>
            )}
            {selectedMinScore !== 'All' && (
              <span className="filter-pill">
                Min Score: {selectedMinScore}+
                <button type="button" onClick={() => setSelectedMinScore('All')}>×</button>
              </span>
            )}
            {selectedRecency !== 'All' && (
              <span className="filter-pill">
                Recency: 24h
                <button type="button" onClick={() => setSelectedRecency('All')}>×</button>
              </span>
            )}
            <button
              type="button"
              className="btn-clear-all"
              onClick={clearFilters}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Results Meta */}
      <div className="results-count-bar">
        <span>
          Showing <strong>{filteredOpportunities.length}</strong> of {opportunities.length} signals
        </span>
      </div>

      {/* Restrained List Rows (Clean dividers, No nested card sprawl) */}
      {filteredOpportunities.length === 0 ? (
        <div className="empty-state-panel card-panel">
          <IconFilter size={32} className="empty-icon" />
          <h3 className="empty-title">No matching signals found</h3>
          <p className="empty-desc">
            No technical signals matched your active filter criteria. Try resetting filters or searching a different technology.
          </p>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="signals-feed-container card-panel">
          <div className="signals-rows-list">
            {filteredOpportunities.map((opp) => (
              <article key={opp.id} className="signal-feed-row">
                {/* Row Header: Source Brand, Channel, Recency, Badges */}
                <div className="feed-row-top">
                  <div className="feed-source-cell">
                    <SourceBadge source={opp.source} channel={opp.sourceChannel} url={opp.sourceUrl} />
                    <span className="meta-sep">•</span>
                    <span className="feed-time-label">{opp.postedAt}</span>
                    <span className="meta-sep">•</span>
                    <span className="feed-author-label">by {opp.author}</span>
                  </div>

                  <div className="feed-row-badges">
                    <SeverityBadge severity={opp.severity} />
                    <ScoreBadge score={opp.score} size="small" />
                  </div>
                </div>

                {/* Problem Title & Company Match */}
                <div className="feed-row-main">
                  <Link to={`/opportunity/${opp.id}`} className="feed-row-headline">
                    {opp.title}
                  </Link>

                  <div className="feed-account-line">
                    <span className="feed-account-label">Company Match:</span>
                    <strong className="feed-account-name">{opp.company}</strong>
                    <span className="feed-account-loc">({opp.location})</span>
                    <span className="feed-demo-pill">Sample Match</span>
                  </div>

                  <p className="feed-row-summary">
                    {opp.problemSummary}
                  </p>

                  {/* Excerpt Snippet */}
                  <div className="feed-code-snippet">
                    <div className="snippet-top">
                      <IconTerminal size={12} />
                      <span>Original public discussion excerpt</span>
                    </div>
                    <pre>
                      <code>{opp.originalExcerpt.slice(0, 240)}...</code>
                    </pre>
                  </div>

                  {/* Tech Tags */}
                  <div className="feed-tech-tags">
                    {(opp.technologies || []).map((t) => (
                      <span
                        key={t}
                        className={`tech-tag tag-sm ${selectedTech === t ? 'tag-selected' : ''}`}
                        onClick={() => setSelectedTech(selectedTech === t ? 'All' : t)}
                        title={`Filter by ${t}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Row Footer Actions */}
                <div className="feed-row-footer">
                  <div className="feed-stage-inline">
                    <span className="stage-control-label">Stage:</span>
                    <select
                      className="stage-select-compact"
                      value={opp.pipelineStage}
                      onChange={(e) => updateOpportunityStage(opp.id, e.target.value)}
                    >
                      {PIPELINE_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="feed-actions-group">
                    <Link to={`/outreach/${opp.id}`} className="btn btn-secondary btn-xs">
                      <IconMail size={12} />
                      <span>Compose Outreach</span>
                    </Link>

                    <Link to={`/opportunity/${opp.id}`} className="btn btn-primary btn-xs">
                      <span>Inspect Signal</span>
                      <IconArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
