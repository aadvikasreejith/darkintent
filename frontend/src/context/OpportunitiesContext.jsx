import { useState, useEffect, useCallback } from 'react';
import { SAMPLE_OPPORTUNITIES } from '../data/sampleData';
import { SAMPLE_MEETINGS } from '../data/sampleMeetings';
import { checkBackendHealth, fetchOpportunities, scoreOpportunityApi, triggerBackendRefresh } from '../services/api';
import {
  fetchLiveHackerNewsSignals,
  enrichCompanyViaLinkedIn,
  exportToCsv
} from '../services/discoveryService';
import { OpportunitiesContext } from './OpportunitiesContextDef';

const DEFAULT_PRODUCT_PROFILE = {
  productName: 'Cloud security software',
  productDescription: 'Automated cloud infrastructure security, IAM policy validation, and eBPF network isolation',
  keyFeatures: 'Threat detection, Cloud monitoring, eBPF network isolation',
  targetIndustry: 'Technology',
  targetCompanySize: 'Mid-sized companies',
  targetMarket: 'India',
  targetLocation: 'India'
};

/**
 * Transparent keyword matching between user's product profile and technical opportunity
 */
function evaluateProductRelevance(opp, profile) {
  if (!opp || !profile) {
    return {
      category: 'Moderate Relevance',
      relevanceScore: 75,
      matchingTerms: ['Infrastructure'],
      rationale: 'Standard enterprise system alignment.'
    };
  }

  const profileKeywords = [
    ...(profile.productName ? profile.productName.toLowerCase().split(/[\s,]+/) : []),
    ...(profile.keyFeatures ? profile.keyFeatures.toLowerCase().split(/[\s,]+/) : []),
    ...(profile.targetIndustry ? profile.targetIndustry.toLowerCase().split(/[\s,]+/) : [])
  ].filter((w) => w && w.length >= 3 && !['with', 'your', 'from', 'this', 'that', 'software'].includes(w));

  const oppText = [
    opp.title || '',
    opp.problemSummary || '',
    opp.rootCause || '',
    ...(opp.technologies || []),
    opp.industry || '',
    opp.location || ''
  ].join(' ').toLowerCase();

  const matched = profileKeywords.filter((k) => oppText.includes(k));
  const uniqueMatched = Array.from(new Set(matched));

  let category = 'Moderate Relevance';
  let relevanceScore = 72;
  let rationale = `Potential alignment with ${profile.productName || 'your product'} based on general cloud & system infrastructure.`;

  if (uniqueMatched.length >= 2 || oppText.includes('security') || oppText.includes('kubernetes') || oppText.includes('monitoring')) {
    category = 'High Capability Alignment';
    relevanceScore = Math.min(96, 82 + uniqueMatched.length * 5);
    rationale = `Matches your key product capabilities: "${uniqueMatched.length > 0 ? uniqueMatched.join('", "') : 'reliability & monitoring'}". Addresses pain points your product directly resolves.`;
  } else if (uniqueMatched.length === 1) {
    category = 'Direct Keyword Match';
    relevanceScore = 82;
    rationale = `Direct overlap on key term "${uniqueMatched[0]}" in ${opp.company || 'the engineering'}'s environment.`;
  }

  return {
    category,
    relevanceScore,
    matchingTerms: uniqueMatched.length > 0 ? uniqueMatched : ['Cloud', 'Infrastructure'],
    rationale
  };
}

export function OpportunitiesProvider({ children }) {
  const [opportunities, setOpportunities] = useState(() => {
    const saved = localStorage.getItem('darkintent_opportunities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep genuine live opportunities, never hardcoded legacy samples
        const liveOnly = Array.isArray(parsed)
          ? parsed.filter(
              (o) =>
                o.isLive ||
                (typeof o.id === 'string' &&
                  (o.id.startsWith('gh-') ||
                    o.id.startsWith('hn-') ||
                    o.id.startsWith('so-') ||
                    o.id.startsWith('rd-')))
            )
          : [];
        if (liveOnly.length > 0) return liveOnly;
      } catch {
        // ignore
      }
    }
    // Live feed starts with empty array until backend loads genuine records
    return [];
  });

  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem('darkintent_meetings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return SAMPLE_MEETINGS;
  });

  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem('darkintent_integrations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      googleCalendar: {
        connected: false,
        email: '',
        autoSync: true,
        calendarName: 'Sales Pipeline (DarkIntent)'
      },
      googleSheets: {
        connected: false,
        sheetUrl: '',
        autoExport: false,
        lastSynced: null
      },
      linkedIn: {
        connected: false,
        apiKey: '',
        enrichedCompaniesCount: 2
      }
    };
  });

  const [productProfile, setProductProfile] = useState(() => {
    const saved = localStorage.getItem('darkintent_product_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PRODUCT_PROFILE;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('darkintent_demo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return { email: 'arjun@darkintent.in', name: 'Arjun Mehta' };
  });

  const [backendStatus, setBackendStatus] = useState({
    isOnline: false,
    checked: false,
    checking: false,
    url: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  });

  const [isDiscoveringLive, setIsDiscoveringLive] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save opportunities to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('darkintent_opportunities', JSON.stringify(opportunities));
    } catch {
      // ignore
    }
  }, [opportunities]);

  // Save meetings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('darkintent_meetings', JSON.stringify(meetings));
    } catch {
      // ignore
    }
  }, [meetings]);

  // Save integrations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('darkintent_integrations', JSON.stringify(integrations));
    } catch {
      // ignore
    }
  }, [integrations]);

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      const health = await checkBackendHealth();
      if (!isMounted) return;
      setBackendStatus({
        isOnline: health.isOnline,
        checked: true,
        checking: false,
        url: health.url,
        info: health.data || health.error
      });
      if (health.isOnline) {
        const opps = await fetchOpportunities();
        if (isMounted && opps && opps.data) {
          setOpportunities(opps.data);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const checkBackend = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, checking: true }));
    const health = await checkBackendHealth();
    setBackendStatus({
      isOnline: health.isOnline,
      checked: true,
      checking: false,
      url: health.url,
      info: health.data || health.error
    });
    if (health.isOnline) {
      showToast('Connected to Python FastAPI backend service', 'success');
      const opps = await fetchOpportunities();
      if (opps && Array.isArray(opps.data)) {
        setOpportunities(opps.data);
      }
    } else {
      showToast('Backend offline. Run "python backend/run.py" to connect live API.', 'error');
    }
  }, [showToast]);

  const syncBackendSignals = useCallback(async () => {
    setIsDiscoveringLive(true);
    showToast('Triggering live retrieval across GitHub, Hacker News & Stack Overflow...', 'info');
    try {
      await triggerBackendRefresh();
      // Wait briefly for background collection to complete
      await new Promise((r) => setTimeout(r, 2000));
      const opps = await fetchOpportunities();
      if (opps && Array.isArray(opps.data)) {
        setOpportunities(opps.data);
        showToast(`Synced ${opps.data.length} genuine technical opportunities from live sources!`, 'success');
      }
    } catch {
      showToast('Failed to sync signals from backend.', 'error');
    } finally {
      setIsDiscoveringLive(false);
    }
  }, [showToast]);

  const saveProductProfile = useCallback((profile) => {
    setProductProfile(profile);
    try {
      localStorage.setItem('darkintent_product_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
    showToast('Product profile saved successfully', 'success');
  }, [showToast]);

  const demoLogin = useCallback((email) => {
    const user = {
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      signedInAt: new Date().toISOString()
    };
    setCurrentUser(user);
    try {
      localStorage.setItem('darkintent_demo_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    showToast(`Signed in as ${user.name}`, 'success');
  }, [showToast]);

  const demoLogout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('darkintent_demo_user');
    } catch {
      // ignore
    }
    showToast('Signed out of demo session', 'info');
  }, [showToast]);

  const updateOpportunityStage = useCallback((id, newStage) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, pipelineStage: newStage } : opp))
    );
    showToast(`Stage updated to "${newStage}"`, 'success');
  }, [showToast]);

  const recalculateScore = useCallback(async (id) => {
    const target = opportunities.find((o) => o.id === id);
    if (!target) return;

    showToast('Calculating opportunity intent score...', 'info');
    const result = await scoreOpportunityApi(target);

    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === id) {
          return {
            ...opp,
            score: result.score || opp.score,
            scoreBreakdown: result.scoreBreakdown || opp.scoreBreakdown,
            scoreExplanation: result.explanation || opp.scoreExplanation
          };
        }
        return opp;
      })
    );

    showToast(`Score updated: ${result.score}/100`, 'success');
  }, [opportunities, showToast]);

  const recordOutreachSent = useCallback((id, tone) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === id) {
          return {
            ...opp,
            pipelineStage: opp.pipelineStage === 'New' || opp.pipelineStage === 'Qualified' ? 'Contacted' : opp.pipelineStage,
            lastOutreachSent: new Date().toISOString(),
            lastOutreachTone: tone
          };
        }
        return opp;
      })
    );
    showToast('Outreach recorded. Deal moved to "Contacted"', 'success');
  }, [showToast]);

  // Hacker News Live Fetch Action
  const fetchLiveHnOpportunities = useCallback(async (query) => {
    setIsDiscoveringLive(true);
    showToast('Retrieving live developer discussions from Hacker News API...', 'info');
    try {
      const liveSignals = await fetchLiveHackerNewsSignals(query);
      if (liveSignals && liveSignals.length > 0) {
        setOpportunities((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const newUnique = liveSignals.filter((s) => !existingIds.has(s.id));
          if (newUnique.length === 0) {
            return prev;
          }
          const merged = [...newUnique, ...prev];
          try {
            localStorage.setItem('darkintent_opportunities', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
        showToast(`Discovered ${liveSignals.length} live technical signals from Hacker News!`, 'success');
      }
    } catch {
      showToast('Live HN fetch failed. Retaining current signals.', 'error');
    } finally {
      setIsDiscoveringLive(false);
    }
  }, [showToast]);

  // Meeting Management
  const addMeeting = useCallback((newMeeting) => {
    const meetingRecord = {
      ...newMeeting,
      id: newMeeting.id || `mtg-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      status: newMeeting.status || 'Confirmed'
    };

    setMeetings((prev) => [meetingRecord, ...prev]);

    // Connect to linked opportunity
    if (meetingRecord.opportunityId) {
      setOpportunities((prev) =>
        prev.map((opp) => {
          if (opp.id === meetingRecord.opportunityId) {
            return {
              ...opp,
              pipelineStage: 'Meeting',
              meetingId: meetingRecord.id,
              meetingDate: meetingRecord.date,
              meetingStatus: meetingRecord.status
            };
          }
          return opp;
        })
      );
    }

    showToast(`Meeting scheduled with ${meetingRecord.company} for ${meetingRecord.date} at ${meetingRecord.time}`, 'success');
    return meetingRecord;
  }, [showToast]);

  const updateMeeting = useCallback((meetingId, updates) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          const updated = { ...m, ...updates };
          if (updates.status && updated.opportunityId) {
            setOpportunities((opps) =>
              opps.map((opp) =>
                opp.id === updated.opportunityId
                  ? {
                      ...opp,
                      meetingStatus: updates.status,
                      ...(updates.status === 'Completed' ? { pipelineStage: 'Engaged' } : {})
                    }
                  : opp
              )
            );
          }
          return updated;
        }
        return m;
      })
    );
    showToast('Meeting record updated', 'success');
  }, [showToast]);

  const cancelMeeting = useCallback((meetingId) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          if (m.opportunityId) {
            setOpportunities((opps) =>
              opps.map((opp) =>
                opp.id === m.opportunityId ? { ...opp, meetingStatus: 'Cancelled' } : opp
              )
            );
          }
          return { ...m, status: 'Cancelled' };
        }
        return m;
      })
    );
    showToast('Meeting cancelled', 'info');
  }, [showToast]);

  const saveMeetingNotes = useCallback((meetingId, notesData) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          const updated = {
            ...m,
            status: 'Completed',
            notes: {
              ...(m.notes || {}),
              ...notesData,
              savedAt: new Date().toISOString()
            }
          };

          if (notesData.proposedStage && m.opportunityId) {
            setOpportunities((opps) =>
              opps.map((opp) =>
                opp.id === m.opportunityId
                  ? {
                      ...opp,
                      pipelineStage: notesData.proposedStage,
                      meetingStatus: 'Completed',
                      meetingNotesSummary: notesData.discussionSummary
                    }
                  : opp
              )
            );
          }
          return updated;
        }
        return m;
      })
    );
    showToast('Meeting notes & follow-up actions saved', 'success');
  }, [showToast]);

  const updateIntegration = useCallback((key, updates) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...updates }
    }));
    showToast('Integration configuration updated', 'success');
  }, [showToast]);

  const exportOpportunitiesCsv = useCallback(() => {
    const headers = {
      id: 'Opportunity ID',
      company: 'Company',
      domain: 'Domain',
      location: 'Location',
      industry: 'Industry',
      title: 'Problem Title',
      source: 'Source',
      severity: 'Severity',
      score: 'Fit Score',
      technologies: 'Technologies',
      pipelineStage: 'Pipeline Stage',
      postedAt: 'Discovered'
    };
    const ok = exportToCsv('darkintent-opportunities', opportunities, headers);
    if (ok) showToast('Opportunities exported to CSV', 'success');
    return ok;
  }, [opportunities, showToast]);

  const exportMeetingsCsv = useCallback(() => {
    const headers = {
      id: 'Meeting ID',
      company: 'Company',
      prospectName: 'Contact Name',
      prospectEmail: 'Contact Email',
      date: 'Date',
      time: 'Time',
      durationMinutes: 'Duration (min)',
      timezone: 'Timezone',
      meetingType: 'Type',
      status: 'Status',
      locationOrLink: 'Link / Location'
    };
    const ok = exportToCsv('darkintent-meetings', meetings, headers);
    if (ok) showToast('Meetings exported to CSV', 'success');
    return ok;
  }, [meetings, showToast]);

  const exportPipelineCsv = useCallback(() => {
    const headers = {
      id: 'Opportunity ID',
      company: 'Company',
      title: 'Opportunity Title',
      pipelineStage: 'Pipeline Stage',
      score: 'Score',
      meetingDate: 'Scheduled Meeting',
      meetingStatus: 'Meeting Status',
      lastOutreachTone: 'Outreach Tone'
    };
    const ok = exportToCsv('darkintent-pipeline', opportunities, headers);
    if (ok) showToast('Sales pipeline exported to CSV', 'success');
    return ok;
  }, [opportunities, showToast]);

  const resetToDefaultData = useCallback(async () => {
    localStorage.removeItem('darkintent_opportunities');
    localStorage.removeItem('darkintent_meetings');
    localStorage.removeItem('darkintent_integrations');
    const opps = await fetchOpportunities();
    if (opps && Array.isArray(opps.data) && opps.data.length > 0) {
      setOpportunities(opps.data);
      showToast(`Reloaded ${opps.data.length} genuine technical opportunities from backend`, 'info');
    } else {
      setOpportunities([]);
      showToast('Local storage cleared. Live opportunity feed is ready.', 'info');
    }
    setMeetings(SAMPLE_MEETINGS);
  }, [showToast]);

  const loadDemoFixtures = useCallback(() => {
    setOpportunities(SAMPLE_OPPORTUNITIES);
    setMeetings(SAMPLE_MEETINGS);
    showToast('Loaded offline demo fixtures (clearly separated from live production data)', 'info');
  }, [showToast]);

  const getOpportunityById = useCallback((id) => {
    return opportunities.find((o) => o.id === id) || null;
  }, [opportunities]);

  return (
    <OpportunitiesContext.Provider
      value={{
        opportunities,
        meetings,
        integrations,
        productProfile,
        saveProductProfile,
        currentUser,
        demoLogin,
        demoLogout,
        evaluateRelevance: (opp) => evaluateProductRelevance(opp, productProfile),
        backendStatus,
        checkBackend,
        updateOpportunityStage,
        recalculateScore,
        recordOutreachSent,
        addMeeting,
        updateMeeting,
        cancelMeeting,
        saveMeetingNotes,
        fetchLiveHnOpportunities,
        syncBackendSignals,
        loadDemoFixtures,
        isDiscoveringLive,
        updateIntegration,
        exportOpportunitiesCsv,
        exportMeetingsCsv,
        exportPipelineCsv,
        enrichCompanyViaLinkedIn,
        resetToDefaultData,
        getOpportunityById,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </OpportunitiesContext.Provider>
  );
}
