import { useState, useEffect, useRef } from 'react';
import { useOpportunities } from '../context/useOpportunities';
import {
  IconMic,
  IconMicOff,
  IconClose,
  IconSparkles,
  IconCalendar,
  IconMail,
  IconExternalLink
} from './Icons';

export function VoiceAssistantModal({ isOpen, onClose }) {
  const { opportunities = [], meetings = [], showToast } = useOpportunities();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        setQueryInput(text);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        showToast(`Voice input: ${event.error || 'Microphone error'}`, 'info');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [showToast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition not supported in this browser. Please use text input.', 'info');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch {
        // restart
      }
    }
  };

  const processQuery = (rawText) => {
    const text = (rawText || queryInput).toLowerCase().trim();
    if (!text) return;

    setIsThinking(true);
    setAssistantResponse(null);

    setTimeout(() => {
      let result = null;

      // 1. Next meeting / brief
      if (text.includes('brief') || text.includes('next meeting') || text.includes('prepare') || text.includes('schedule')) {
        const nextMtg = meetings.find((m) => m.status === 'Confirmed' || m.status === 'Proposed') || meetings[0];
        if (nextMtg) {
          result = {
            title: `Pre-Call Brief: ${nextMtg.company}`,
            summary: `Your next meeting is with ${nextMtg.prospectName} (${nextMtg.prospectTitle || 'Contact'}) on ${nextMtg.date} at ${nextMtg.time}.`,
            details: [
              `Technical Issue: ${nextMtg.brief?.problemSummary || nextMtg.title}`,
              `Core Objective: ${nextMtg.brief?.suggestedObjectives || 'Establish POC timeline'}`,
              `Top Question: "${nextMtg.brief?.discoveryQuestions?.[0] || 'What is your current resolution timeline?'}"`
            ],
            actionLink: '/meetings',
            actionText: 'Open Full Meeting Brief'
          };
        }
      }

      // 2. Summarize opportunity / top signal
      else if (text.includes('summarize') || text.includes('opportunity') || text.includes('signal') || text.includes('deal')) {
        const topOpp = [...opportunities].sort((a, b) => b.score - a.score)[0];
        if (topOpp) {
          result = {
            title: `Top Signal: ${topOpp.company} (${topOpp.score}/100 Fit Score)`,
            summary: `${topOpp.company} in ${topOpp.location} reported ${topOpp.title}.`,
            details: [
              `Severity: ${topOpp.severity} · Source: ${topOpp.source} (${topOpp.postedAt})`,
              `Root Cause: ${topOpp.problemSummary.slice(0, 140)}...`,
              `Key Technologies: ${topOpp.technologies?.join(', ')}`
            ],
            actionLink: `/opportunity/${topOpp.id}`,
            actionText: 'View Opportunity Workspace'
          };
        }
      }

      // 3. Follow-up tasks / what should I follow up on
      else if (text.includes('follow') || text.includes('action') || text.includes('todo') || text.includes('task')) {
        const mtgWithNotes = meetings.find((m) => m.notes?.agreedActions || m.notes?.followUpDate);
        if (mtgWithNotes) {
          result = {
            title: `Follow-up Action for ${mtgWithNotes.company}`,
            summary: `Agreed next step: ${mtgWithNotes.notes?.agreedActions || 'Send benchmark proposal'}`,
            details: [
              `Responsible Person: ${mtgWithNotes.notes?.responsiblePerson || 'Sales Lead'}`,
              `Target Follow-up Date: ${mtgWithNotes.notes?.followUpDate || 'End of sprint'}`,
              `Summary: ${mtgWithNotes.notes?.discussionSummary?.slice(0, 110) || 'Active evaluation in progress'}`
            ],
            actionLink: '/meetings',
            actionText: 'Review Notes & Pipeline'
          };
        } else {
          result = {
            title: 'No Pending Blockers',
            summary: 'All scheduled meetings have updated action items.',
            details: ['Check Pipeline tab to advance contacted deals.']
          };
        }
      }

      // 4. Draft follow-up email
      else if (text.includes('email') || text.includes('draft') || text.includes('outreach')) {
        const topOpp = opportunities[0];
        result = {
          title: `Draft Follow-up for ${topOpp?.company || 'Prospect'}`,
          summary: `Prepared message tailored to ${topOpp?.technologies?.[0] || 'cloud'} architecture.`,
          details: [
            `Subject: Great speaking with you — ${topOpp?.company} next steps`,
            'Body highlights key pain points and requests a 15-minute architecture demonstration.'
          ],
          actionLink: `/outreach/${topOpp?.id || ''}`,
          actionText: 'Open Email Composition Workspace'
        };
      }

      // Fallback response
      else {
        result = {
          title: 'DarkIntent Sales Intelligence',
          summary: `Understood: "${rawText}". I can prepare your pre-call brief, analyze high-intent signals, or outline follow-up actions.`,
          details: [
            'Try asking: "Prepare my brief for the next meeting"',
            'Try asking: "Summarize this top opportunity"',
            'Try asking: "What should I follow up on?"'
          ]
        };
      }

      setAssistantResponse(result);
      setIsThinking(false);

      // Speech synthesis read-aloud if enabled
      if (speechSynthesisEnabled && window.speechSynthesis && result) {
        const utter = new SpeechSynthesisUtterance(`${result.title}. ${result.summary}`);
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      }
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window voice-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon voice-icon-green">
            <IconSparkles size={18} />
          </div>
          <div>
            <span className="modal-tag">Conversational Assistant</span>
            <h2 className="modal-title font-editorial">DarkIntent Voice Co-Pilot</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body-scroll voice-modal-body">
          {/* Voice Input Controls */}
          <div className="voice-input-center-box">
            <button
              type="button"
              className={`voice-mic-button ${isListening ? 'mic-listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Click to stop listening' : 'Click to start voice input'}
            >
              {isListening ? <IconMic size={28} /> : <IconMicOff size={28} />}
            </button>
            <span className="voice-status-hint">
              {isListening ? (transcript ? `"${transcript}"` : 'Listening to your request... speak clearly') : 'Tap microphone or type your question below'}
            </span>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="voice-quick-chips">
            <button
              type="button"
              className="quick-chip-btn"
              onClick={() => {
                setQueryInput('Prepare my brief for the next meeting');
                processQuery('Prepare my brief for the next meeting');
              }}
            >
              <IconCalendar size={12} />
              <span>Prepare next meeting brief</span>
            </button>

            <button
              type="button"
              className="quick-chip-btn"
              onClick={() => {
                setQueryInput('Summarize top opportunity');
                processQuery('Summarize top opportunity');
              }}
            >
              <IconSparkles size={12} />
              <span>Summarize top opportunity</span>
            </button>

            <button
              type="button"
              className="quick-chip-btn"
              onClick={() => {
                setQueryInput('What should I follow up on?');
                processQuery('What should I follow up on?');
              }}
            >
              <IconMail size={12} />
              <span>What should I follow up on?</span>
            </button>
          </div>

          {/* Text Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processQuery(queryInput);
            }}
            className="voice-text-form"
          >
            <input
              type="text"
              className="form-input voice-text-input"
              placeholder="e.g. Prepare my brief for the next meeting..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={isThinking || !queryInput.trim()}>
              {isThinking ? 'Analyzing...' : 'Ask Assistant'}
            </button>
          </form>

          {/* Response Box */}
          {assistantResponse && (
            <div className="voice-response-panel card-panel">
              <h3 className="voice-res-title font-editorial">{assistantResponse.title}</h3>
              <p className="voice-res-summary">{assistantResponse.summary}</p>

              {assistantResponse.details && (
                <ul className="voice-res-details">
                  {assistantResponse.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}

              {assistantResponse.actionLink && (
                <div className="voice-res-action-row">
                  <a
                    href={assistantResponse.actionLink}
                    className="btn btn-outline btn-xs"
                    onClick={onClose}
                  >
                    <span>{assistantResponse.actionText || 'Open Details'}</span>
                    <IconExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer voice-footer">
          <label className="toggle-label text-xs">
            <input
              type="checkbox"
              checked={speechSynthesisEnabled}
              onChange={(e) => setSpeechSynthesisEnabled(e.target.checked)}
            />
            <span className="toggle-text">Read response aloud (Text-to-Speech)</span>
          </label>

          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
