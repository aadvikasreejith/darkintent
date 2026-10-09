import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { generateOutreachApi } from '../services/api';
import {
  IconCopy,
  IconCheck,
  IconSparkles,
  IconMail,
  IconCalendar
} from '../components/Icons';

function parseDraft(opp, tone) {
  if (!opp) return { subject: '', body: '' };
  const toneKey = tone === 'friendly' ? 'executive' : tone === 'concise' ? 'technical' : 'consultative';
  const draft = opp.outreachDrafts?.[toneKey] || opp.outreachDrafts?.consultative || '';
  const lines = draft.split('\n');

  if (lines[0]?.startsWith('Subject: ')) {
    return {
      subject: lines[0].replace('Subject: ', ''),
      body: lines.slice(2).join('\n')
    };
  }
  return {
    subject: `Solving ${opp.company || 'the team'}'s ${opp.technologies?.[0] || 'infrastructure'} challenge`,
    body: draft || 'Hi,\n\nI noticed your team troubleshooting technical bottlenecks on public developer channels...'
  };
}

function OutreachComposer({
  opportunity,
  recordOutreachSent,
  showToast
}) {
  const [currentTone, setCurrentTone] = useState('professional');
  const initialDraft = useMemo(() => parseDraft(opportunity, 'professional'), [opportunity]);
  const recipient = opportunity?.companyMatch?.targetContact || '';
  const [recipientEmail, setRecipientEmail] = useState(
    () => opportunity?.companyMatch?.contactEmail || ''
  );
  const [subjectLine, setSubjectLine] = useState(() => initialDraft.subject);
  const [emailBody, setEmailBody] = useState(() => initialDraft.body);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleToneChange = (tone) => {
    setCurrentTone(tone);
    if (opportunity) {
      const parsed = parseDraft(opportunity, tone);
      setSubjectLine(parsed.subject);
      setEmailBody(parsed.body);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subjectLine}\nTo: ${recipientEmail || recipient}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToast('Outreach message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRegenerate = async () => {
    if (!opportunity) return;
    setIsGenerating(true);
    showToast('Regenerating draft with contextual intelligence...', 'info');

    const backendTone = currentTone === 'friendly' ? 'executive' : currentTone === 'concise' ? 'technical' : 'consultative';
    const result = await generateOutreachApi({
      opportunity: opportunity,
      tone: backendTone,
      recipient: recipient.split(',')[0]
    });

    if (result.subject) setSubjectLine(result.subject);
    if (result.body) setEmailBody(result.body);

    setIsGenerating(false);
    showToast(`Draft updated for ${currentTone} tone.`, 'success');
  };

  const handleSaveDraft = () => {
    if (opportunity) {
      recordOutreachSent(opportunity.id, currentTone);
      setIsSaved(true);
      showToast('Draft recorded in pipeline stage.', 'success');
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  const wordCount = emailBody.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main className="outreach-composition-panel card-panel">
      {/* Recipient & Subject Header Area */}
      <div className="outreach-email-meta-fields">
        {/* 1. Recipient */}
        <div className="outreach-meta-row">
          <label htmlFor="outreach-recipient-email" className="outreach-meta-label">
            To:
          </label>
          <div className="outreach-meta-input-wrap">
            <input
              id="outreach-recipient-email"
              type="email"
              className="outreach-meta-input"
              placeholder="name@company.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            {recipient && (
              <span className="outreach-recipient-hint">
                Target: {recipient}
              </span>
            )}
          </div>
        </div>

        {/* 2. Subject */}
        <div className="outreach-meta-row">
          <label htmlFor="outreach-subject" className="outreach-meta-label">
            Subject:
          </label>
          <div className="outreach-meta-input-wrap">
            <input
              id="outreach-subject"
              type="text"
              className="outreach-meta-input font-medium"
              placeholder="Subject line..."
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="outreach-tone-toolbar">
        <span className="outreach-tone-label">Tone:</span>
        <div className="outreach-tone-pills">
          <button
            type="button"
            className={`outreach-tone-btn ${currentTone === 'professional' ? 'tone-selected' : ''}`}
            onClick={() => handleToneChange('professional')}
          >
            Professional
          </button>
          <button
            type="button"
            className={`outreach-tone-btn ${currentTone === 'friendly' ? 'tone-selected' : ''}`}
            onClick={() => handleToneChange('friendly')}
          >
            Friendly
          </button>
          <button
            type="button"
            className={`outreach-tone-btn ${currentTone === 'concise' ? 'tone-selected' : ''}`}
            onClick={() => handleToneChange('concise')}
          >
            Concise
          </button>
        </div>
        <span className="outreach-word-count font-mono">{wordCount} words</span>
      </div>

      {/* 3. Message Body (Largest Element in the Panel) */}
      <div className="outreach-body-wrapper">
        <textarea
          id="outreach-body"
          className="outreach-body-textarea"
          rows={14}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          placeholder="Write or edit your outreach message here..."
          aria-label="Email message body"
        />
      </div>

      {/* 5. Actions Footer */}
      <div className="outreach-actions-footer">
        <div className="outreach-actions-left">
          <button
            type="button"
            className="btn btn-outline btn-sm btn-regenerate"
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            <IconSparkles size={14} />
            <span>{isGenerating ? 'Regenerating...' : 'Regenerate draft'}</span>
          </button>
        </div>

        <div className="outreach-actions-right">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSaveDraft}
            title="Save draft to pipeline stage"
          >
            {isSaved ? <IconCheck size={14} /> : null}
            <span>{isSaved ? 'Draft saved' : 'Save draft'}</span>
          </button>

          <Link
            to={`/meetings?oppId=${opportunity?.id}`}
            className="btn btn-outline btn-sm"
            title="Book executive discovery meeting with prospect"
          >
            <IconCalendar size={14} />
            <span>Schedule Meeting →</span>
          </Link>

          <button
            type="button"
            className="btn btn-primary btn-sm btn-copy-outreach"
            onClick={handleCopy}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            <span>{copied ? 'Copied to clipboard' : 'Copy message'}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export function OutreachPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { opportunities, getOpportunityById, showToast, recordOutreachSent } = useOpportunities();

  // If no ID or invalid, default to first opportunity
  const selectedOpportunity = (id && getOpportunityById(id)) || opportunities[0];

  const handleSelectOpportunity = (newId) => {
    navigate(`/outreach/${newId}`);
  };

  if (!selectedOpportunity) {
    return (
      <div className="outreach-empty-screen">
        <div className="outreach-empty-box card-panel">
          <IconMail size={32} />
          <h2 className="font-editorial">No opportunity selected</h2>
          <p>Please select an opportunity from the Opportunities directory to compose outreach.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/opportunities')}
          >
            Explore Opportunities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="outreach-workspace-container">
      {/* Top Header & Context Line */}
      <header className="outreach-workspace-header">
        <div className="outreach-header-text">
          <h1 className="outreach-page-title font-editorial">Compose outreach</h1>
          <p className="outreach-page-subtitle">
            Start a thoughtful conversation with the right person.
          </p>
        </div>

        {/* Small, Unobtrusive Context Line Identifying Company & Lead */}
        <div className="outreach-target-context-pill">
          <label htmlFor="outreach-opp-switcher" className="context-lead-label">Context:</label>
          <select
            id="outreach-opp-switcher"
            className="context-lead-select"
            value={selectedOpportunity.id}
            onChange={(e) => handleSelectOpportunity(e.target.value)}
            aria-label="Switch target opportunity"
          >
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.company} ({opp.location || 'India'})
              </option>
            ))}
          </select>
          {selectedOpportunity.companyMatch?.targetContact && (
            <span className="context-contact-name font-medium">
              · {selectedOpportunity.companyMatch.targetContact}
            </span>
          )}
        </div>
      </header>

      {/* Prominent, Focused Email Composition Workspace (No Signal Reference Card) */}
      <OutreachComposer
        key={selectedOpportunity.id}
        opportunity={selectedOpportunity}
        recordOutreachSent={recordOutreachSent}
        showToast={showToast}
      />
    </div>
  );
}
