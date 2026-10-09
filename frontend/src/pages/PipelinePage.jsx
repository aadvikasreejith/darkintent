import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { PIPELINE_STAGES, formatINR } from '../data/sampleData';
import { ScoreBadge } from '../components/ScoreBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { SourceBadge } from '../components/SourceBadge';
import {
  IconSearch,
  IconArrowLeft,
  IconArrowRight,
  IconMail,
  IconCalendar,
  IconDownload
} from '../components/Icons';

export function PipelinePage() {
  const { opportunities, updateOpportunityStage, exportPipelineCsv, meetings = [] } = useOpportunities();
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState('All');

  // Collect unique technologies
  const allTechnologies = useMemo(() => {
    const set = new Set();
    opportunities.forEach((o) => (o.technologies || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [opportunities]);

  // Filtered by search & tech
  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      if (pipelineSearch.trim()) {
        const q = pipelineSearch.toLowerCase();
        const mCompany = (o.company || o.sourceIdentifier || '').toLowerCase().includes(q);
        const mTitle = (o.title || '').toLowerCase().includes(q);
        const mLoc = (o.location || '').toLowerCase().includes(q);
        if (!mCompany && !mTitle && !mLoc) return false;
      }
      if (selectedTech !== 'All' && !(o.technologies || []).includes(selectedTech)) {
        return false;
      }
      return true;
    });
  }, [opportunities, pipelineSearch, selectedTech]);

  // Move stage helper
  const handleMoveStage = (oppId, currentStage, direction) => {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex + direction;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= PIPELINE_STAGES.length) targetIndex = PIPELINE_STAGES.length - 1;

    const newStage = PIPELINE_STAGES[targetIndex];
    if (newStage !== currentStage) {
      updateOpportunityStage(oppId, newStage);
    }
  };

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.pipelineValue || 3500000), 0);

  return (
    <div className="pipeline-page">
      {/* Intro Header */}
      <div className="page-header-intro">
        <div>
          <h1 className="page-title">Opportunity Pipeline</h1>
          <p className="page-subtitle">
            Progress deals from public signal detection through consultative outreach, meetings, and closed won.
          </p>
        </div>
        <div className="pipeline-kpi-summary">
          <span className="pipeline-kpi-label">Active Pipeline Value:</span>
          <span className="pipeline-kpi-val font-editorial">{formatINR(totalValue, true)} ARR</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pipeline-toolbar card-panel">
        <div className="pipeline-toolbar-left">
          <div className="search-input-wrap">
            <IconSearch size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Filter pipeline by company, city (Bengaluru...), or issue title..."
              value={pipelineSearch}
              onChange={(e) => setPipelineSearch(e.target.value)}
            />
          </div>

          <div className="tech-filter-wrap">
            <select
              className="filter-select"
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              aria-label="Filter by technology"
            >
              <option value="All">All Stacks</option>
              {allTechnologies.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pipeline-toolbar-right flex-row items-center gap-2">
          <span className="pipeline-deals-count font-medium">
            {filteredOpps.length} deals in pipeline
          </span>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={exportPipelineCsv}
            title="Export complete pipeline to CSV"
          >
            <IconDownload size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Clean Compact Kanban Board */}
      <div className="kanban-board-scroll">
        <div className="kanban-columns-track">
          {PIPELINE_STAGES.map((stage, stageIndex) => {
            const stageOpps = filteredOpps.filter((o) => o.pipelineStage === stage);
            const stageTotalValue = stageOpps.reduce((acc, curr) => acc + (curr.pipelineValue || 3500000), 0);

            return (
              <div key={stage} className="kanban-column">
                {/* Column Header */}
                <div className="kanban-column-header">
                  <div className="column-title-row">
                    <span className="column-title">{stage}</span>
                    <span className="column-count-badge">{stageOpps.length}</span>
                  </div>
                  <div className="column-sub-row">
                    <span className="column-value-sub">
                      {formatINR(stageTotalValue, true)} ARR
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="kanban-cards-list">
                  {stageOpps.length === 0 ? (
                    <div className="column-empty-state">
                      <span>No deals in {stage}</span>
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div key={opp.id} className="kanban-card">
                        {/* Company & Score */}
                        <div className="kanban-card-top">
                          <div className="kanban-company-block">
                            <span className="kanban-company font-semibold">{opp.company || opp.sourceIdentifier || 'Community Discussion'}</span>
                            <span className="kanban-location-sub">{opp.location}</span>
                          </div>
                          <ScoreBadge score={opp.score} size="small" showLabel={false} />
                        </div>

                        {/* Title Link */}
                        <Link to={`/opportunity/${opp.id}`} className="kanban-problem-link">
                          {opp.title}
                        </Link>

                        {/* Meta: Severity & INR Value */}
                        <div className="kanban-card-meta">
                          <SeverityBadge severity={opp.severity} />
                          <span className="kanban-card-val font-mono">
                            {formatINR(opp.pipelineValue || 3500000, true)}
                          </span>
                        </div>

                        {/* Meeting Schedule Pill if exists */}
                        {(() => {
                          const linkedMtg = meetings.find((m) => m.opportunityId === opp.id || m.id === opp.meetingId);
                          if (!linkedMtg && !opp.meetingDate) return null;
                          const mStatus = linkedMtg?.status || opp.meetingStatus || 'Scheduled';
                          const mDate = linkedMtg?.date || opp.meetingDate;
                          return (
                            <div className="kanban-mtg-indicator-row">
                              <Link
                                to={`/meetings?oppId=${opp.id}`}
                                className={`kanban-mtg-chip status-${mStatus.toLowerCase().replace(/\s+/g, '-')}`}
                                title={`Meeting: ${mStatus} on ${mDate}`}
                              >
                                <IconCalendar size={11} />
                                <span>{mDate} · {mStatus}</span>
                              </Link>
                            </div>
                          );
                        })()}

                        {/* Source Logo & Recency */}
                        <div className="kanban-source-row">
                          <SourceBadge source={opp.source} channel={opp.sourceChannel} url={opp.sourceUrl} />
                          <span className="kanban-time">{opp.postedAt}</span>
                        </div>

                        {/* Stage Controls */}
                        <div className="kanban-card-controls">
                          <div className="move-buttons-group">
                            <button
                              type="button"
                              className="btn-move"
                              disabled={stageIndex === 0}
                              onClick={() => handleMoveStage(opp.id, stage, -1)}
                              title={stageIndex > 0 ? `Move back to ${PIPELINE_STAGES[stageIndex - 1]}` : 'First stage'}
                              aria-label="Move stage backward"
                            >
                              <IconArrowLeft size={11} />
                            </button>
                            <select
                              className="stage-select-mini"
                              value={opp.pipelineStage}
                              onChange={(e) => updateOpportunityStage(opp.id, e.target.value)}
                              aria-label="Change stage"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn-move"
                              disabled={stageIndex === PIPELINE_STAGES.length - 1}
                              onClick={() => handleMoveStage(opp.id, stage, 1)}
                              title={stageIndex < PIPELINE_STAGES.length - 1 ? `Advance to ${PIPELINE_STAGES[stageIndex + 1]}` : 'Final stage'}
                              aria-label="Move stage forward"
                            >
                              <IconArrowRight size={11} />
                            </button>
                          </div>

                          <div className="quick-links-group">
                            <Link
                              to={`/meetings?oppId=${opp.id}`}
                              className="kanban-action-link"
                              title="Schedule or inspect meeting"
                            >
                              <IconCalendar size={13} />
                            </Link>
                            <Link to={`/outreach/${opp.id}`} className="kanban-action-link" title="Compose outreach">
                              <IconMail size={13} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
