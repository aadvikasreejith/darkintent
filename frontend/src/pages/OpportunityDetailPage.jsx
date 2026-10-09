import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { fetchOpportunityById, analyzeOpportunity } from '../services/api';
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
  IconCheckCircle,
  IconCalendar,
  IconSparkles
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
    productProfile,
    meetings = []
  } = useOpportunities();

  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'groq-llm', 'actions', 'company', 'discussion'
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const contextOpp = getOpportunityById(id);
  const [asyncOpp, setAsyncOpp] = useState(null);
  const [isLoadingAsync, setIsLoadingAsync] = useState(!contextOpp);

  useEffect(() => {
    if (!contextOpp && id) {
      let active = true;
      fetchOpportunityById(id).then((res) => {
        if (active) {
          if (res?.data) {
            setAsyncOpp(res.data);
          }
          setIsLoadingAsync(false);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [contextOpp, id]);

  const opp = contextOpp || asyncOpp;
  const linkedMeeting = meetings.find((m) => m.opportunityId === opp?.id || m.id === opp?.meetingId);

  if (isLoadingAsync) {
    return (
      <div className="card-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <IconRefresh size={22} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--forest-600)' }} />
        <p style={{ color: 'var(--ink-600)', fontSize: '0.92rem' }}>Retrieving live signal telemetry for <code>{id}</code>...</p>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="detail-not-found card-panel">
        <h2 className="panel-title">Opportunity not found</h2>
        <p className="panel-subtitle">
          The opportunity with ID <code>{id}</code> could not be located in the current database.
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

  const handleRunGroqAnalysis = async () => {
    if (!opp?.id) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await analyzeOpportunity(opp.id);
      if (res?.error) {
        setAnalysisError(res.error);
        showToast(res.error, 'error');
      } else {
        setLlmAnalysis(res);
        showToast('Deep Groq LLM Technical Analysis generated', 'success');
      }
    } catch (err) {
      setAnalysisError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
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

          <Link to={`/meetings?oppId=${opp.id}`} className="btn btn-outline" title="Schedule or view discovery meeting">
            <IconCalendar size={15} />
            <span>{linkedMeeting ? `Meeting: ${linkedMeeting.status}` : 'Schedule Meeting'}</span>
          </Link>

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
            <span className="company-tag-strong">{opp.company || opp.sourceIdentifier || 'Community Discussion'}</span>
            {opp.domain && <span className="company-domain-tag">{opp.domain}</span>}
            <span className="meta-sep">•</span>
            <span className="company-sub-meta">{opp.location || 'Global (Remote)'} · {opp.industry || 'Cloud Infrastructure & Systems'}</span>
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

      {/* Required Simple Tab Row: Analysis, Groq LLM, Recommended Actions, Company Info, Discussion */}
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
          className={`detail-tab-btn ${activeTab === 'groq-llm' ? 'tab-active' : ''}`}
          onClick={() => {
            setActiveTab('groq-llm');
            if (!llmAnalysis && !isAnalyzing) {
              handleRunGroqAnalysis();
            }
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <IconSparkles size={13} />
          <span>Groq LLM (9-Dim)</span>
          {llmAnalysis && <span style={{ background: 'var(--forest-100)', color: 'var(--forest-800)', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>LIVE</span>}
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

      {/* Tab 2: Groq LLM Technical Inference (9 Dimensions) */}
      {activeTab === 'groq-llm' && (
        <div className="detail-tab-content">
          <div className="card-panel mb-4">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-success font-mono" style={{ background: 'var(--forest-100)', color: 'var(--forest-900)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                    GROQ LLM INFERENCE
                  </span>
                  {llmAnalysis?.model && (
                    <span className="badge font-mono" style={{ background: 'var(--bg-subtle)', color: 'var(--ink-700)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                      Model: {llmAnalysis.model}
                    </span>
                  )}
                  {llmAnalysis?.analyzedAt && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-500)' }}>
                      Inferred: {new Date(llmAnalysis.analyzedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <h3 className="panel-title font-editorial" style={{ fontSize: '1.25rem', margin: '4px 0 2px 0' }}>9-Dimensional Deep Discussion Analysis</h3>
                <p className="panel-subtitle" style={{ fontSize: '0.84rem', color: 'var(--ink-600)', margin: 0 }}>
                  Genuine model-inferred technical intelligence grounded directly in the original discussion text.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRunGroqAnalysis}
                disabled={isAnalyzing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconRefresh size={14} className={isAnalyzing ? 'spin' : ''} />
                <span>{isAnalyzing ? 'Inferring with Groq...' : (llmAnalysis ? 'Re-run Inference' : 'Run Groq Analysis')}</span>
              </button>
            </div>

            {isAnalyzing && (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <IconRefresh size={26} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--forest-600)' }} />
                <p style={{ color: 'var(--ink-800)', fontWeight: 600, fontSize: '0.95rem' }}>Executing live Groq inference on discussion excerpt...</p>
                <p style={{ color: 'var(--ink-500)', fontSize: '0.82rem' }}>Extracting core technical problem, business consequences, and qualified sales angle.</p>
              </div>
            )}

            {analysisError && !isAnalyzing && (
              <div style={{ background: 'var(--status-red-bg)', border: '1px solid var(--status-red-border)', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                <h4 style={{ color: 'var(--status-red-text)', margin: '0 0 6px 0', fontSize: '0.92rem', fontWeight: 700 }}>LLM Configuration Notice</h4>
                <p style={{ color: 'var(--ink-800)', fontSize: '0.85rem', margin: 0 }}>
                  {analysisError}
                </p>
                <p style={{ color: 'var(--ink-600)', fontSize: '0.78rem', marginTop: '8px' }}>
                  Set <code>GROQ_API_KEY</code> in <code>backend/.env</code> to enable live Groq model execution.
                </p>
              </div>
            )}

            {!llmAnalysis && !isAnalyzing && !analysisError && (
              <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px dashed var(--border-medium)', marginTop: '16px' }}>
                <IconSparkles size={28} style={{ color: 'var(--forest-600)', margin: '0 auto 10px', display: 'block' }} />
                <h4 style={{ color: 'var(--ink-900)', fontSize: '0.96rem', margin: '0 0 6px 0' }}>Ready to Execute Groq Technical Inference</h4>
                <p style={{ color: 'var(--ink-600)', fontSize: '0.84rem', maxWidth: '520px', margin: '0 auto 16px' }}>
                  Analyze this discussion using official Groq LLM across 9 dimensions: summary, bottleneck, technologies, business impact, severity, sales relevance, evidence, next step, and uncertainty.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRunGroqAnalysis}
                >
                  <IconSparkles size={14} />
                  <span>Execute Groq LLM Analysis</span>
                </button>
              </div>
            )}

            {llmAnalysis && !isAnalyzing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' }}>
                {/* 1. Plain Language Summary */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--forest-800)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>1. Plain-Language Summary</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-900)', marginTop: '6px', lineHeight: 1.5 }}>{llmAnalysis.plainLanguageSummary}</p>
                </div>

                {/* 2. Core Technical Problem */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-red-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>2. Core Technical Bottleneck</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-900)', marginTop: '6px', lineHeight: 1.5 }}>{llmAnalysis.coreTechnicalProblem}</p>
                </div>

                {/* 3. Relevant Technologies */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--forest-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>3. Detected Technologies</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {(llmAnalysis.relevantTechnologies || []).map((t, idx) => (
                      <span key={idx} className="tech-tag" style={{ fontSize: '0.75rem' }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* 4. Potential Impact */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-amber-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>4. Potential Business Impact</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-900)', marginTop: '6px', lineHeight: 1.5 }}>{llmAnalysis.potentialImpact}</p>
                </div>

                {/* 5. Severity & Urgency */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>5. Severity & Operational Urgency</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-900)', marginTop: '6px', lineHeight: 1.5 }}>{llmAnalysis.severityAndUrgency}</p>
                </div>

                {/* 6. Sales Relevance */}
                <div style={{ background: 'var(--forest-50)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--forest-200)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--forest-800)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>6. Commercial Sales Relevance</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--forest-950)', marginTop: '6px', lineHeight: 1.5 }}>{llmAnalysis.salesRelevance}</p>
                </div>

                {/* 7. Supporting Evidence */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>7. Discussion Evidence</span>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '0.84rem', color: 'var(--ink-800)' }}>
                    {(Array.isArray(llmAnalysis.evidence) ? llmAnalysis.evidence : [llmAnalysis.evidence]).map((ev, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{ev}</li>
                    ))}
                  </ul>
                </div>

                {/* 8. Recommended Next Step */}
                <div style={{ background: 'var(--forest-50)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--forest-200)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--forest-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>8. Recommended Sales Discovery Step</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--forest-950)', marginTop: '6px', lineHeight: 1.5, fontWeight: 500 }}>{llmAnalysis.recommendedNextStep}</p>
                </div>

                {/* 9. Confidence & Uncertainty */}
                <div style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>9. Confidence & Assumptions</span>
                  <p style={{ fontSize: '0.84rem', color: 'var(--ink-700)', marginTop: '6px', lineHeight: 1.5 }}>{llmAnalysis.confidenceAndUncertainty}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Recommended Actions */}
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
                    <Link to={`/outreach/${opp.id}`} className="btn btn-primary">
                      <IconMail size={16} />
                      <span>Open Outreach Composer for {opp.company}</span>
                    </Link>

                    <Link to={`/meetings?oppId=${opp.id}`} className="btn btn-outline">
                      <IconCalendar size={16} />
                      <span>{linkedMeeting ? 'View Meeting Workspace' : 'Schedule Discovery Meeting'}</span>
                    </Link>
                  </div>

                  {/* Meeting Intelligence Brief & Notes Preview */}
                  {linkedMeeting ? (
                    <div className="detail-meeting-intel-card card-panel mt-4">
                      <div className="panel-header">
                        <div className="flex-row items-center gap-2">
                          <IconSparkles size={16} className="text-gold" />
                          <h4 className="panel-title font-editorial">Scheduled Discovery Session</h4>
                        </div>
                        <span className={`status-badge-inline status-${linkedMeeting.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {linkedMeeting.status}
                        </span>
                      </div>

                      <div className="intel-preview-body">
                        <div className="intel-meta-grid">
                          <div>
                            <span className="intel-meta-k">Date & Time</span>
                            <span className="intel-meta-v font-mono">{linkedMeeting.date} · {linkedMeeting.time} ({linkedMeeting.timezone})</span>
                          </div>
                          <div>
                            <span className="intel-meta-k">Prospect Lead</span>
                            <span className="intel-meta-v">{linkedMeeting.prospectName} ({linkedMeeting.prospectTitle || 'Engineering'})</span>
                          </div>
                          <div>
                            <span className="intel-meta-k">Duration</span>
                            <span className="intel-meta-v">{linkedMeeting.durationMinutes} mins</span>
                          </div>
                        </div>

                        {linkedMeeting.brief && (
                          <div className="intel-section-snippet">
                            <span className="intel-snippet-label">Pre-Call Objective:</span>
                            <p className="intel-snippet-text">{linkedMeeting.brief.suggestedObjectives}</p>
                          </div>
                        )}

                        {linkedMeeting.notes?.discussionSummary && (
                          <div className="intel-section-snippet">
                            <span className="intel-snippet-label">Latest Post-Call Notes:</span>
                            <p className="intel-snippet-text">{linkedMeeting.notes.discussionSummary}</p>
                            {linkedMeeting.notes.agreedActions && (
                              <p className="intel-action-highlight">
                                <strong>Agreed Action:</strong> {linkedMeeting.notes.agreedActions}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="intel-card-footer">
                          <Link to={`/meetings?oppId=${opp.id}`} className="btn btn-primary btn-sm">
                            <IconCalendar size={14} />
                            <span>Open Full Brief & Post-Call Notes →</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-meeting-prompt-card card-panel mt-4">
                      <div className="panel-header">
                        <div className="flex-row items-center gap-2">
                          <IconCalendar size={16} />
                          <h4 className="panel-title font-editorial">Schedule Architecture Discovery Call</h4>
                        </div>
                      </div>
                      <p className="panel-subtitle">
                        Lock in an executive 15-minute sync with {opp.companyMatch?.targetContact || 'engineering leadership'} regarding {opp.company}'s {opp.technologies?.[0] || 'infrastructure'} challenge.
                      </p>
                      <div className="mt-3">
                        <Link to={`/meetings?oppId=${opp.id}`} className="btn btn-outline btn-sm">
                          <IconCalendar size={14} />
                          <span>Launch Booking Flow for {opp.company} →</span>
                        </Link>
                      </div>
                    </div>
                  )}
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

              {/* Verified Enterprise Enrichment Card */}
              {opp.enrichment && (
                <div className="card-panel mt-4" style={{ border: '1px solid var(--forest-300)', background: 'var(--forest-50)' }}>
                  <div className="panel-header">
                    <div>
                      <span className="badge badge-success font-mono" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        {opp.enrichment.isVerified ? 'VERIFIED ENTERPRISE ENTITY' : 'COMMUNITY / UNVERIFIED ENTITY'}
                      </span>
                      <h4 className="panel-title font-editorial mt-1">{opp.enrichment.companyName || opp.company}</h4>
                      <p className="panel-subtitle font-mono" style={{ fontSize: '0.74rem' }}>
                        {opp.enrichment.verificationConfidence}
                      </p>
                    </div>
                  </div>

                  <div className="buyer-match-box" style={{ background: '#ffffff', borderRadius: '8px', padding: '12px' }}>
                    {opp.enrichment.publicBusinessPhone && (
                      <div className="buyer-persona-row">
                        <span className="buyer-label font-semibold" style={{ color: 'var(--forest-900)' }}>Public Business Phone:</span>
                        <span className="buyer-val font-mono font-bold" style={{ color: 'var(--forest-800)' }}>
                          {opp.enrichment.publicBusinessPhone}
                        </span>
                      </div>
                    )}
                    {opp.enrichment.website && (
                      <div className="buyer-persona-row">
                        <span className="buyer-label">Official Website:</span>
                        <a href={opp.enrichment.website} target="_blank" rel="noopener noreferrer" className="buyer-val font-mono" style={{ color: 'var(--forest-700)', textDecoration: 'underline' }}>
                          {opp.enrichment.website}
                        </a>
                      </div>
                    )}
                    {opp.enrichment.headquarters && (
                      <div className="buyer-persona-row">
                        <span className="buyer-label">Headquarters:</span>
                        <span className="buyer-val">{opp.enrichment.headquarters}</span>
                      </div>
                    )}
                    {opp.enrichment.description && (
                      <div className="buyer-persona-row">
                        <span className="buyer-label">Description:</span>
                        <span className="buyer-val" style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{opp.enrichment.description}</span>
                      </div>
                    )}
                    {opp.enrichment.salesContactUrl && (
                      <div className="buyer-persona-row">
                        <span className="buyer-label">Direct Contact Page:</span>
                        <a href={opp.enrichment.salesContactUrl} target="_blank" rel="noopener noreferrer" className="buyer-val font-mono" style={{ color: 'var(--forest-700)', textDecoration: 'underline' }}>
                          {opp.enrichment.salesContactUrl}
                        </a>
                      </div>
                    )}
                    {opp.enrichment.evidenceLinks && opp.enrichment.evidenceLinks.length > 0 && (
                      <div className="buyer-persona-row">
                        <span className="buyer-label">Verified Sources:</span>
                        <div className="buyer-val" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {opp.enrichment.evidenceLinks.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: 'var(--forest-600)', textDecoration: 'underline' }}>
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
