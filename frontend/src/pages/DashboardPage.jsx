import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { ANALYTICS_DATA, formatINR } from '../data/sampleData';
import { ScoreBadge } from '../components/ScoreBadge';
import {
  LogoGitHub,
  LogoReddit,
  LogoHackerNews,
  LogoStackOverflow,
  IconArrowRight,
  IconExternalLink
} from '../components/Icons';

// Helper to provide concise, specific technical problem titles (approx 4–8 words)
function getShortProblemTitle(title) {
  if (!title) return '';

  const conciseMap = {
    'PostgreSQL connection exhaustion under load (Prisma + PgBouncer failure)':
      'PostgreSQL Connection Pool Exhaustion under Load',
    'Milvus / pgvector indexing OOM crashes on 50M+ 1536-dim embeddings':
      'Milvus & pgvector Indexing OOM Crashes',
    'Snowflake credit runaway and dbt warehouse lockup on 8TB transaction ledger':
      'Snowflake Credit Runaway & Warehouse Lockup',
    '504 Gateway Timeouts and Envoy TLS saturation on AWS EKS ingress controller':
      '504 Gateway Timeouts on AWS EKS',
    'Kafka consumer lag spikes and rebalance storm during partition reassignment':
      'Kafka Consumer Lag Spikes & Rebalances',
    'Cilium eBPF network policy audit failures in multi-tenant Kubernetes':
      'Cilium eBPF Policy Audit Failures in Kubernetes',
    'Redis memory fragmentation and OOM evictions during vector cache surge':
      'Redis Memory Fragmentation & Cache Evictions',
    'Elasticsearch cluster red status and unassigned shards after node recovery':
      'Elasticsearch Red Status & Unassigned Shards'
  };

  if (conciseMap[title]) return conciseMap[title];

  // Algorithmic fallback: strip secondary parentheticals and limit to 4-8 words
  const cleaned = title.replace(/\s*\([^)]*\)/g, '').replace(/,\s*causing.*$/i, '');
  const words = cleaned.split(/\s+/);
  if (words.length <= 8) return cleaned;
  return words.slice(0, 7).join(' ');
}

export function DashboardPage() {
  const { opportunities, currentUser } = useOpportunities();

  // Greeting based on Indian Standard Time hour
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    const firstName = currentUser?.name?.split(' ')[0] || 'Team';
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  });

  // Four small summary metrics
  const newOppsCount = opportunities.filter(
    (o) => o.pipelineStage === 'New' || o.pipelineStage === 'Qualified'
  ).length;

  const inOutreachCount = opportunities.filter(
    (o) => o.pipelineStage === 'Contacted' || o.pipelineStage === 'Engaged'
  ).length;

  const meetingsCount = opportunities.filter(
    (o) => o.pipelineStage === 'Meeting'
  ).length;

  const closedWonCount = opportunities.filter(
    (o) => o.pipelineStage === 'Won/Lost'
  ).length;

  // Recent high-priority signals (sorted by score descending)
  const recentOpportunities = useMemo(() => {
    return [...opportunities]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [opportunities]);

  // Source logo mapper for the distribution section
  const getSourceLogo = (sourceName) => {
    const s = sourceName.toLowerCase();
    if (s.includes('github')) return <LogoGitHub size={16} />;
    if (s.includes('reddit')) return <LogoReddit size={16} />;
    if (s.includes('hacker') || s.includes('hn')) return <LogoHackerNews size={16} />;
    if (s.includes('stack')) return <LogoStackOverflow size={16} />;
    return <LogoGitHub size={16} />;
  };

  return (
    <div className="dashboard-page">
      {/* Compact Header & Date */}
      <div className="dashboard-header-row">
        <h1 className="dashboard-greeting-title font-editorial">{greeting}</h1>
        <div className="compact-date-control">
          <span className="date-icon-indicator" />
          <span className="date-text">Today · 09 Oct 2026 (IST)</span>
        </div>
      </div>

      {/* Four Small Summary Metrics */}
      <div className="four-metrics-row">
        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">New Opportunities</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{newOppsCount}</span>
          </div>
          <span className="metric-foot-note">Sample signals</span>
        </div>

        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">In Outreach</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{inOutreachCount}</span>
          </div>
          <span className="metric-foot-note">Active threads</span>
        </div>

        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">Meetings</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{meetingsCount}</span>
          </div>
          <span className="metric-foot-note">Architecture reviews</span>
        </div>

        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">Closed Won</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{closedWonCount}</span>
          </div>
          <span className="metric-foot-note">{formatINR(4800000, true)} pipeline</span>
        </div>
      </div>

      {/* Main Focus: Recent Opportunities Rounded Tiles */}
      <section className="dashboard-section-block">
        <div className="section-header-row">
          <h2 className="section-main-title font-editorial">Recent Opportunities</h2>
          <Link to="/opportunities" className="btn btn-outline btn-sm">
            <span>View all {opportunities.length}</span>
            <IconArrowRight size={13} />
          </Link>
        </div>

        {/* Rounded Tiles List (12px radius, 8px gap, 14-16px padding) */}
        <div className="recent-opps-tiles-list" role="list">
          {recentOpportunities.map((opp) => {
            const shortTitle = getShortProblemTitle(opp.title);
            return (
              <div key={opp.id} className="opp-tile-card" role="listitem">
                {/* Left Area: Short Problem Title & Source / Company Meta */}
                <div className="opp-tile-main-block">
                  <Link
                    to={`/opportunity/${opp.id}`}
                    className="opp-tile-problem-title"
                    title={opp.title}
                  >
                    {shortTitle}
                  </Link>

                  <div className="opp-tile-supporting-meta">
                    <div className="opp-tile-source-info">
                      <span className="opp-tile-source-logo" aria-hidden="true">
                        {getSourceLogo(opp.source)}
                      </span>
                      <span className="opp-tile-source-name">{opp.source}</span>
                      {opp.sourceUrl && (
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opp-tile-source-link"
                          title="View public discussion thread"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Open ${opp.source} thread in new tab`}
                        >
                          <IconExternalLink size={11} />
                        </a>
                      )}
                      <span className="meta-bullet-sep">•</span>
                      <span className="opp-tile-recency">{opp.postedAt}</span>
                    </div>

                    {opp.company && (
                      <div className="opp-tile-company-info">
                        <span className="meta-bullet-sep">•</span>
                        <span className="opp-tile-company-name">{opp.company}</span>
                        {opp.location && (
                          <span className="opp-tile-company-location">
                            ({opp.location})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Opportunity Score, Status Pill & View Action */}
                <div className="opp-tile-actions-block">
                  <div className="opp-tile-score-box">
                    <ScoreBadge score={opp.score} size="small" />
                  </div>

                  <div className="opp-tile-status-box">
                    <span className="opp-tile-status-badge">{opp.pipelineStage}</span>
                  </div>

                  <div className="opp-tile-btn-box">
                    <Link
                      to={`/opportunity/${opp.id}`}
                      className="btn btn-outline btn-xs opp-tile-inspect-btn"
                      title="Inspect opportunity details"
                    >
                      <span>View</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compact Source Distribution with Authentic Brand Logos */}
      <section className="dashboard-sources-compact card-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title font-editorial">Source Distribution</h3>
            <span className="panel-hint">Sample dataset · 4 public channels</span>
          </div>
        </div>

        <div className="brand-sources-compact-grid">
          {ANALYTICS_DATA.sourceDistribution.map((item) => (
            <div key={item.source} className="brand-source-compact-card">
              <div className="brand-source-meta">
                <div className="brand-icon-wrap">
                  {getSourceLogo(item.source)}
                </div>
                <div className="brand-source-info">
                  <span className="brand-title-name font-medium">{item.source}</span>
                  <span className="brand-share-pct font-mono">{item.percentage}% ({item.count})</span>
                </div>
              </div>

              <div className="source-track-bar">
                <div
                  className="source-fill-bar"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
