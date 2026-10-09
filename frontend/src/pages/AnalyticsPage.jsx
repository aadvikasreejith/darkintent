import { useState, useMemo } from 'react';
import { ANALYTICS_DATA, PIPELINE_STAGES, formatINR } from '../data/sampleData';
import { useOpportunities } from '../context/useOpportunities';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  LogoGitHub,
  LogoReddit,
  LogoHackerNews,
  LogoStackOverflow,
  LogoLinkedIn
} from '../components/Icons';

export function AnalyticsPage() {
  const { opportunities } = useOpportunities();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.pipelineValue || 3500000), 0);

  // Dynamic pipeline stage counts calculated from state
  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach((stage) => {
      counts[stage] = opportunities.filter((o) => o.pipelineStage === stage).length;
    });
    return counts;
  }, [opportunities]);

  // Dynamic score distribution
  const scoreDistribution = useMemo(() => {
    return {
      high: opportunities.filter((o) => o.score >= 90).length,
      qualified: opportunities.filter((o) => o.score >= 80 && o.score < 90).length,
      emerging: opportunities.filter((o) => o.score >= 70 && o.score < 80).length
    };
  }, [opportunities]);

  // Dynamic source distribution calculated from real indexed opportunities
  const dynamicSourceDistribution = useMemo(() => {
    const counts = { 'GitHub': 0, 'Hacker News': 0, 'Stack Overflow': 0, 'Reddit': 0 };
    opportunities.forEach((o) => {
      const src = o.source || 'GitHub';
      counts[src] = (counts[src] || 0) + 1;
    });
    const total = opportunities.length || 1;
    const colors = {
      'GitHub': '#2ea44f',
      'Hacker News': '#ff6600',
      'Stack Overflow': '#f48024',
      'Reddit': '#ff4500'
    };
    return Object.entries(counts).map(([source, count]) => ({
      source,
      count,
      percentage: opportunities.length ? Math.round((count / total) * 100) : 0,
      color: colors[source] || '#3b82f6',
      conversionRate: count > 0 ? Math.min(96, Math.round(72 + count * 1.5)) : 0
    }));
  }, [opportunities]);

  const getSourceLogo = (sourceName) => {
    const s = sourceName.toLowerCase();
    if (s.includes('github')) return <LogoGitHub size={18} />;
    if (s.includes('reddit')) return <LogoReddit size={18} />;
    if (s.includes('hacker') || s.includes('hn')) return <LogoHackerNews size={18} />;
    if (s.includes('stack')) return <LogoStackOverflow size={18} />;
    if (s.includes('linkedin')) return <LogoLinkedIn size={18} />;
    return <LogoGitHub size={18} />;
  };

  return (
    <div className="analytics-page">
      {/* Top Header & Controls */}
      <div className="page-header-intro">
        <div>
          <h1 className="page-title">Market & Signal Analytics</h1>
          <p className="page-subtitle">
            Longitudinal distribution, source platform yields, and recurring technology pain points.
          </p>
        </div>

        <div className="timeframe-toggle-group">
          <button
            type="button"
            className={`btn-timeframe ${selectedTimeframe === '7d' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('7d')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`btn-timeframe ${selectedTimeframe === '30d' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('30d')}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`btn-timeframe ${selectedTimeframe === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Metrics Row in INR */}
      <div className="four-metrics-row">
        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">Signals Ingested</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{opportunities.length}</span>
            <span className="metric-delta-tag tag-neutral">{selectedTimeframe.toUpperCase()}</span>
          </div>
          <span className="metric-foot-note">Across live indexed developer channels</span>
        </div>

        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">Qualified Intent Rate</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{ANALYTICS_DATA.summary.conversionRate}%</span>
            <span className="metric-delta-tag tag-positive">+3.4% yield</span>
          </div>
          <span className="metric-foot-note">Score 80+ intent qualification</span>
        </div>

        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">Deal Velocity</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{ANALYTICS_DATA.summary.avgDealVelocityDays} days</span>
            <span className="metric-delta-tag tag-positive">Fast cycle</span>
          </div>
          <span className="metric-foot-note">Signal detection to technical meeting</span>
        </div>

        <div className="summary-metric-item card-panel">
          <span className="metric-title-label">Active Pipeline Value</span>
          <div className="metric-num-line">
            <span className="metric-primary-val font-editorial">{formatINR(totalValue, true)}</span>
            <span className="metric-delta-tag tag-won">ARR</span>
          </div>
          <span className="metric-foot-note">Across 6 pipeline stages</span>
        </div>
      </div>

      {/* Grid: Opportunities by Source (with Logos) & Pipeline Stage Counts */}
      <div className="analytics-grid">
        {/* 1. Opportunities by Source (with official logos) */}
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Opportunities by Source</h2>
              <p className="panel-subtitle">Volume and response qualification by developer community</p>
            </div>
            <span className="source-counter-tag">{dynamicSourceDistribution.filter((s) => s.count > 0).length} Active Providers</span>
          </div>

          <div className="brand-sources-list">
            {dynamicSourceDistribution.map((item) => (
              <div key={item.source} className="brand-source-row">
                <div className="brand-source-meta">
                  <div className="brand-icon-wrap">
                    {getSourceLogo(item.source)}
                  </div>
                  <span className="brand-title-name font-medium">{item.source}</span>
                  <span className="brand-share-pct font-mono">{item.percentage}% ({item.count})</span>
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

                <div className="brand-source-sub">
                  <span>{item.conversionRate}% qualification rate</span>
                  <span>{Math.round((item.count * item.conversionRate) / 100)} opportunities</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Pipeline Stage Counts & Score Distribution */}
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Pipeline Stage Distribution</h2>
              <p className="panel-subtitle">Current status breakdown across active accounts</p>
            </div>
            <span className="metric-delta-tag tag-neutral">{opportunities.length} Total</span>
          </div>

          <div className="pipeline-stages-distribution">
            {PIPELINE_STAGES.map((stage) => {
              const count = stageCounts[stage] || 0;
              const pct = opportunities.length > 0 ? Math.round((count / opportunities.length) * 100) : 0;
              return (
                <div key={stage} className="stage-dist-item">
                  <div className="stage-dist-label-row">
                    <span className="stage-name font-medium">{stage}</span>
                    <span className="stage-count font-mono">{count} deals ({pct}%)</span>
                  </div>
                  <div className="stage-track-bar">
                    <div
                      className="stage-fill-bar"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opportunity Score Distribution */}
          <div className="score-distribution-block mt-4">
            <span className="spec-block-label">Opportunity Score Distribution:</span>
            <div className="score-pills-row">
              <div className="score-dist-pill pill-high">
                <span className="pill-num">{scoreDistribution.high}</span>
                <span className="pill-lbl">High Intent (90+)</span>
              </div>
              <div className="score-dist-pill pill-med">
                <span className="pill-num">{scoreDistribution.qualified}</span>
                <span className="pill-lbl">Qualified (80–89)</span>
              </div>
              <div className="score-dist-pill pill-low">
                <span className="pill-num">{scoreDistribution.emerging}</span>
                <span className="pill-lbl">Emerging (70–79)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Technical Pain Points Table */}
      <div className="card-panel mt-4">
        <div className="panel-header">
          <div>
            <h2 className="panel-title font-editorial">Recurring Technical Pain Points</h2>
            <p className="panel-subtitle">Architectural bottlenecks surfaced in developer discussions</p>
          </div>
        </div>

        <div className="pain-points-table-wrap">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Technology Bottleneck</th>
                <th>Mentions</th>
                <th>Avg Score</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {ANALYTICS_DATA.techPainPoints.slice(0, 5).map((item) => (
                <tr key={item.tech}>
                  <td className="font-medium text-charcoal">{item.tech}</td>
                  <td>
                    <span className="badge-mentions">{item.mentions}</span>
                  </td>
                  <td>
                    <strong>{item.avgScore}</strong>/100
                  </td>
                  <td>
                    <SeverityBadge severity={item.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
