import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { PIPELINE_STAGES, formatINR } from '../data/sampleData';
import { SeverityBadge } from '../components/SeverityBadge';
import { SourceBadge } from '../components/SourceBadge';
import {
  IconArrowLeft,
  IconMail,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconExternalLink,
  IconCheckCircle
} from '../components/Icons';

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getOpportunityById,
    updateOpportunityStage,
    recalculateScore,
    evaluateRelevance,
    showToast,
    productProfile
  } = useOpportunities();

  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'actions', 'company', 'discussion'
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const opp = getOpportunityById(id);

  if (!opp) {
    return (
      <div className="detail-not-found card-panel">
        <h2 className="panel-title">Opportunity not found</h2>
        <p className="panel-subtitle">
          The opportunity with ID <code>{id}</code> could not be located in the current session.
        </p>
        <Link to="/opportunities" className="btn btn-primary btn-sm">
          <IconArrowLeft size={14} />
          <span>Back to Opportunities</span>
        </Link>
      </div>
    );
  }

  // Calculate India-oriented product profile relevance
  const relevance = evaluateRelevance(opp);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(
      `${opp.company} - ${opp.title}\n\nProblem: ${opp.problemSummary}\nRoot cause: ${opp.rootCause}`
    );
    setCopiedSummary(true);
    showToast('Problem summary copied to clipboard', 'success');
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  const handleCopyExcerpt = () => {
    navigator.clipboard.writeText(opp.originalExcerpt);
    setCopiedExcerpt(true);
    showToast('Original technical discussion copied', 'success');
    setTimeout(() => setCopiedExcerpt(false), 2200);
  };

  const handleCopyPitch = () => {
    if (opp.outreachDrafts?.consultative) {
      navigator.clipboard.writeText(opp.outreachDrafts.consultative);
      setCopiedPitch(true);
      showToast('Sample consultative outreach copied', 'success');
      setTimeout(() => setCopiedPitch(false), 2200);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await recalculateScore(opp.id);
    setIsRecalculating(false);
  };

  return (
    <div className="opportunity-detail-page">
      {/* Top Breadcrumb & Stage Controls */}
      <div className="detail-top-nav">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IconArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div className="detail-top-actions">
          <div className="stage-selector-wrap">
            <span className="stage-selector-label">Pipeline Stage:</span>
            <select
              className="stage-select-large"
              value={opp.pipelineStage}
              onChange={(e) => updateOpportunityStage(opp.id, e.target.value)}
              aria-label="Change pipeline stage"
            >
              {PIPELINE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <Link to={`/outreach/${opp.id}`} className="btn btn-primary">
            <IconMail size={15} />
            <span>Compose Outreach</span>
          </Link>
        </div>
      </div>

      {/* Main Opportunity Header Card */}
      <div className="detail-header-card card-panel">
        <div className="detail-header-left">
          {/* Source logo, name, recency and external link */}
          <div className="detail-source-row">
            <SourceBadge source={opp.source} channel={opp.sourceChannel} url={opp.sourceUrl} />
            <span className="meta-sep">•</span>
            <span className="posted-meta">Posted {opp.postedAt}</span>
            <span className="meta-sep">•</span>
            <span className="author-meta">Author: <code>{opp.author}</code></span>
            {opp.sourceUrl && (
              <>
                <span className="meta-sep">•</span>
                <a
                  href={opp.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link-anchor"
                  title="Open original public discussion"
                >
                  <span>Original discussion</span>
                  <IconExternalLink size={12} />
                </a>
              </>
            )}
          </div>

          {/* Discussion Title */}
          <h1 className="detail-headline">{opp.title}</h1>

          {/* Company & Location Context */}
          <div className="detail-company-sub">
            <span className="company-tag-strong">{opp.company}</span>
            <span className="company-domain-tag">{opp.domain}</span>
            <span className="meta-sep">•</span>
            <span className="company-sub-meta">{opp.location} · {opp.industry}</span>
            {opp.pipelineValue && (
              <>
                <span className="meta-sep">•</span>
                <span className="pipeline-val-chip font-mono">
                  {formatINR(opp.pipelineValue, true)} ARR
                </span>
              </>
            )}
          </div>

          {/* Technology Chips */}
          <div className="detail-tech-chips">
            {opp.technologies.map((t) => (
              <span key={t} className="tech-tag">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Commercial Intent Hero Box */}
        <div className="detail-header-right">
          <div className="score-hero-box">
            <div className="score-hero-top">
              <span className="score-hero-label">Commercial Intent Index</span>
              <SeverityBadge severity={opp.severity} />
            </div>
            <div className="score-hero-num-wrap">
              <span className="score-hero-num">{opp.score}</span>
              <span className="score-hero-denom">/100</span>
            </div>
            <div className="score-hero-status">
              <span className="dot-online" />
              <span>{opp.score >= 90 ? 'High Intent • Immediate Action' : 'Qualified Opportunity'}</span>
            </div>
            <button
              type="button"
              className="btn btn-subtle btn-xs btn-recalc"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              title="Recalculate intent scoring"
            >
              <IconRefresh size={12} className={isRecalculating ? 'spin' : ''} />
              <span>{isRecalculating ? 'Calculating...' : 'Recalculate Intent Score'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Required Simple Tab Row: Analysis, Recommended Actions, Company Info, Discussion */}
      <div className="detail-tabs-bar">
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'analysis' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'actions' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          Recommended Actions
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'company' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Company Info
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'discussion' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('discussion')}
        >
          Discussion
        </button>
      </div>

      {/* Tab 1: Analysis */}
      {activeTab === 'analysis' && (
        <div className="detail-tab-content">
          <div className="detail-grid">
            {/* Left: Problem & Root Cause */}
            <div className="detail-left-col">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Technical Problem Summary</h3>
                    <p className="panel-subtitle">Distilled operational bottleneck at {opp.company}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-subtle btn-xs"
                    onClick={handleCopySummary}
                    title="Copy problem summary"
                  >
                    {copiedSummary ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                </div>

                <div className="summary-block">
                  <span className="summary-block-title">Functional Impact</span>
                  <p className="summary-block-p">{opp.problemSummary}</p>
                </div>

                <div className="summary-block">
                  <span className="summary-block-title">Architecture Root Cause</span>
                  <p className="summary-block-p">{opp.rootCause}</p>
                </div>
              </div>

              {/* Product Profile Relevance Box (India-Oriented Opportunity Matching) */}
              <div className="card-panel card-panel-relevance">
                <div className="panel-header">
                  <div>
                    <span className="relevance-tag">Product Profile Alignment</span>
                    <h3 className="panel-title">Why this problem is relevant to your product</h3>
                  </div>
                  <span className="relevance-score-badge">
                    Fit Score: {relevance.relevanceScore}%
                  </span>
                </div>

                <div className="relevance-match-details">
                  <div className="relevance-category-pill">
                    <span>Alignment Level:</span>
                    <strong>{relevance.category}</strong>
                  </div>

                  <div className="relevance-terms-row">
                    <span className="relevance-terms-label">Matching Keywords:</span>
                    <div className="relevance-terms-list">
                      {relevance.matchingTerms.map((term) => (
                        <span key={term} className="tech-tag tag-sm">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="relevance-rationale-text">
                    {relevance.rationale}
                  </p>

                  <div className="relevance-profile-sub">
                    <span>Configured Product: <strong>{productProfile?.productName || 'Cloud security software'}</strong></span>
                    <span>Target Market: <strong>{productProfile?.targetMarket || 'India'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Commercial Intent Index Breakdown */}
            <div className="detail-right-col">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Intent Score Breakdown</h3>
                    <p className="panel-subtitle">Multi-dimensional intent weighting</p>
                  </div>
                </div>

                <div className="score-sub-bars">
                  <div className="sub-bar-item">
                    <div className="sub-bar-label-row">
                      <span>Technical Severity</span>
                      <strong>{opp.scoreBreakdown?.technicalSeverity || 90}/100</strong>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-bar"
                        style={{
                          width: `${opp.scoreBreakdown?.technicalSeverity || 90}%`,
                          backgroundColor: '#8f2824'
                        }}
                      />
                    </div>
                  </div>

                  <div className="sub-bar-item">
                    <div className="sub-bar-label-row">
                      <span>Product Capability Fit</span>
                      <strong>{opp.scoreBreakdown?.capabilityMatch || 92}/100</strong>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-bar"
                        style={{
                          width: `${opp.scoreBreakdown?.capabilityMatch || 92}%`,
                          backgroundColor: '#1b382b'
                        }}
                      />
                    </div>
                  </div>

                  <div className="sub-bar-item">
                    <div className="sub-bar-label-row">
                      <span>Commercial Urgency</span>
                      <strong>{opp.scoreBreakdown?.urgency || 88}/100</strong>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-bar"
                        style={{
                          width: `${opp.scoreBreakdown?.urgency || 88}%`,
                          backgroundColor: '#c46a1e'
                        }}
                      />
                    </div>
                  </div>

                  <div className="sub-bar-item">
                    <div className="sub-bar-label-row">
                      <span>Buyer Authority Match</span>
                      <strong>{opp.scoreBreakdown?.buyerAuthority || 85}/100</strong>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-bar"
                        style={{
                          width: `${opp.scoreBreakdown?.buyerAuthority || 85}%`,
                          backgroundColor: '#2b5c8f'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="score-narrative-box">
                  <h4 className="narrative-title">Intent Rationale</h4>
                  <p className="narrative-text">{opp.scoreExplanation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recommended Actions */}
      {activeTab === 'actions' && (
        <div className="detail-tab-content">
          <div className="detail-grid">
            <div className="detail-left-col">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Recommended Next Action</h3>
                    <p className="panel-subtitle">Tactical outbound playbook tailored to the technical bottleneck</p>
                  </div>
                </div>

                <div className="action-playbook-content">
                  <p className="action-playbook-text font-medium">
                    {opp.recommendedAction}
                  </p>

                  <div className="playbook-guidance-box">
                    <span className="guidance-label">Sales Strategy Rules:</span>
                    <ul className="guidance-list">
                      <li>Address the specific failure condition or error message directly.</li>
                      <li>Write as a peer technical architect, not an aggressive quota SDR.</li>
                      <li>Offer a 10-minute sandbox reproduction, benchmark paper, or architecture doc.</li>
                      <li>Do not claim a verified commercial partnership before holding initial discovery.</li>
                    </ul>
                  </div>

                  <div className="playbook-action-row">
                    <Link to={`/outreach/${opp.id}`} className="btn btn-primary btn-lg">
                      <IconMail size={16} />
                      <span>Open Outreach Composer for {opp.company}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-right-col">
              {/* Sample Prepared Pitch Preview */}
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Consultative Draft Preview</h3>
                    <p className="panel-subtitle">Pre-computed email draft ready for review</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-subtle btn-xs"
                    onClick={handleCopyPitch}
                    title="Copy sample pitch"
                  >
                    {copiedPitch ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    <span>{copiedPitch ? 'Copied' : 'Copy Draft'}</span>
                  </button>
                </div>

                <div className="draft-preview-box">
                  <pre className="draft-preview-text">
                    <code>{opp.outreachDrafts?.consultative || 'No draft generated yet.'}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Company Info */}
      {activeTab === 'company' && (
        <div className="detail-tab-content">
          <div className="detail-grid">
            <div className="detail-left-col">
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Target Account Intelligence</h3>
                    <p className="panel-subtitle">Deterministic firmographic profile for {opp.company}</p>
                  </div>
                </div>

                <div className="buyer-match-box">
                  <div className="buyer-persona-row">
                    <span className="buyer-label">Target Account</span>
                    <span className="buyer-val font-semibold">{opp.companyMatch?.name || opp.company}</span>
                  </div>

                  <div className="buyer-persona-row">
                    <span className="buyer-label">Location</span>
                    <span className="buyer-val">{opp.location}</span>
                  </div>

                  <div className="buyer-persona-row">
                    <span className="buyer-label">Corporate Domain</span>
                    <span className="buyer-val font-mono">{opp.domain}</span>
                  </div>

                  <div className="buyer-persona-row">
                    <span className="buyer-label">Funding & Scale</span>
                    <span className="buyer-val">{opp.companyMatch?.stage || opp.companySize}</span>
                  </div>

                  <div className="buyer-persona-row">
                    <span className="buyer-label">Target Buyer Persona</span>
                    <span className="buyer-val font-semibold">{opp.companyMatch?.buyerPersona}</span>
                  </div>

                  <div className="buyer-persona-row">
                    <span className="buyer-label">Key Contact Person</span>
                    <span className="buyer-val">{opp.companyMatch?.targetContact}</span>
                  </div>

                  <div className="buyer-persona-row">
                    <span className="buyer-label">Estimated Deal Value</span>
                    <span className="buyer-val font-semibold font-editorial">
                      {formatINR(opp.pipelineValue, true)} ARR
                    </span>
                  </div>
                </div>

                <div className="confirmed-stack-section">
                  <span className="stack-label">Confirmed Tech Stack:</span>
                  <div className="stack-badges">
                    {(opp.companyMatch?.techStackConfirmed || opp.technologies).map((stk) => (
                      <span key={stk} className="tech-tag tag-sm">
                        {stk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-right-col">
              {/* Evidence & Distinction between Public Evidence and Inferred Match */}
              <div className="card-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Supporting Evidence & Inferences</h3>
                    <p className="panel-subtitle">Corroborating data points from public discussions</p>
                  </div>
                </div>

                <div className="evidence-sections-wrap">
                  <div className="evidence-block">
                    <span className="evidence-subhead text-forest font-semibold">
                      ✓ Observed Public Evidence (Verifiable):
                    </span>
                    <ul className="evidence-list">
                      {(opp.evidence || []).map((ev, i) => (
                        <li key={i} className="evidence-item">
                          <IconCheckCircle size={15} className="evidence-icon" />
                          <span className="evidence-text">{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="evidence-block inferred-block">
                    <span className="evidence-subhead text-amber font-semibold">
                      ℹ Inferred Account Match (Prototype Heuristics):
                    </span>
                    <p className="inferred-text">
                      Domain resolution and decision maker contacts are mapped via public domain heuristics and LinkedIn titles. Clearly labeled as sample/demo data for this prototype.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Discussion */}
      {activeTab === 'discussion' && (
        <div className="detail-tab-content">
          <div className="card-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Original Technical Discussion Excerpt</h3>
                <p className="panel-subtitle">
                  Captured verbatim from {opp.source} ({opp.sourceChannel})
                </p>
              </div>
              <div className="discussion-panel-actions">
                {opp.sourceUrl && (
                  <a
                    href={opp.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-xs"
                    title="Open original thread"
                  >
                    <span>Open thread</span>
                    <IconExternalLink size={12} />
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-subtle btn-xs"
                  onClick={handleCopyExcerpt}
                  title="Copy log excerpt"
                >
                  {copiedExcerpt ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  <span>{copiedExcerpt ? 'Copied' : 'Copy log'}</span>
                </button>
              </div>
            </div>

            <div className="terminal-container">
              <div className="terminal-header">
                <span className="term-dot red" />
                <span className="term-dot yellow" />
                <span className="term-dot green" />
                <span className="term-title">
                  {opp.source.toLowerCase()}_discussion_{opp.id}.log — {opp.postedAt}
                </span>
              </div>
              <pre className="terminal-body font-mono">
                <code>{opp.originalExcerpt}</code>
              </pre>
            </div>

            <div className="discussion-meta-foot">
              <div className="disc-meta-item">
                <span className="disc-k">Platform:</span>
                <span className="disc-v">{opp.source}</span>
              </div>
              <div className="disc-meta-item">
                <span className="disc-k">Channel / Repo:</span>
                <span className="disc-v">{opp.sourceChannel}</span>
              </div>
              <div className="disc-meta-item">
                <span className="disc-k">Author Handle:</span>
                <span className="disc-v">{opp.author}</span>
              </div>
              <div className="disc-meta-item">
                <span className="disc-k">Detected Timestamp:</span>
                <span className="disc-v">{opp.postedDate || opp.postedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
