import { useState, useEffect, useCallback } from 'react';
import { SAMPLE_OPPORTUNITIES } from '../data/sampleData';
import { checkBackendHealth, fetchOpportunities, scoreOpportunityApi } from '../services/api';
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
    rationale = `Direct overlap on key term "${uniqueMatched[0]}" in ${opp.company}'s engineering environment.`;
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
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return SAMPLE_OPPORTUNITIES;
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
        showToast('Connected to live backend at ' + health.url, 'success');
        const res = await fetchOpportunities();
        if (isMounted && res.source === 'api' && Array.isArray(res.data) && res.data.length > 0) {
          setOpportunities(res.data);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

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
      showToast('Connected to live backend at ' + health.url, 'success');
      const res = await fetchOpportunities();
      if (res.source === 'api' && Array.isArray(res.data) && res.data.length > 0) {
        setOpportunities(res.data);
      }
    } else {
      showToast('Backend offline. Operating in local demo mode.', 'info');
    }
  }, [showToast]);

  const saveProductProfile = useCallback((profileData) => {
    setProductProfile(profileData);
    try {
      localStorage.setItem('darkintent_product_profile', JSON.stringify(profileData));
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

  const resetToDefaultData = useCallback(() => {
    localStorage.removeItem('darkintent_opportunities');
    setOpportunities(SAMPLE_OPPORTUNITIES);
    showToast('Sample dataset restored to initial state', 'info');
  }, [showToast]);

  const getOpportunityById = useCallback((id) => {
    return opportunities.find((o) => o.id === id) || null;
  }, [opportunities]);

  return (
    <OpportunitiesContext.Provider
      value={{
        opportunities,
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
