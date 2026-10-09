import { SAMPLE_OPPORTUNITIES } from '../data/sampleData';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function fetchWithTimeout(resource, options = {}, timeout = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Health check for the backend
 */
export async function checkBackendHealth() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`, { method: 'GET' }, 2000);
    if (res.ok) {
      const data = await res.json();
      return { isOnline: true, data, url: API_BASE_URL };
    }
    return { isOnline: false, status: res.status, url: API_BASE_URL };
  } catch (err) {
    return { isOnline: false, error: err.message, url: API_BASE_URL };
  }
}

/**
 * Fetch all opportunities
 */
export async function fetchOpportunities() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/opportunities`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { source: 'api', data };
      }
    }
  } catch {
    // Graceful fallback to local sample data
  }
  return { source: 'local', data: SAMPLE_OPPORTUNITIES };
}

/**
 * Fetch single opportunity by ID
 */
export async function fetchOpportunityById(id) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/opportunities/${id}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return { source: 'api', data };
    }
  } catch {
    // Graceful fallback to local sample data
  }
  const match = SAMPLE_OPPORTUNITIES.find((item) => item.id === id);
  return { source: 'local', data: match || null };
}

/**
 * Score opportunity via backend POST /api/score with local fallback
 */
export async function scoreOpportunityApi(payload) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/score`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return { source: 'api', ...data };
    }
  } catch {
    // Graceful fallback
  }

  // Local calculation algorithm
  const text = `${payload.title || ''} ${payload.problemSummary || ''} ${payload.originalExcerpt || ''}`.toLowerCase();
  let severityScore = 80;
  if (text.includes('fatal') || text.includes('oomkilled') || text.includes('504') || text.includes('downtime')) {
    severityScore = 96;
  } else if (text.includes('freeze') || text.includes('spike') || text.includes('lockup')) {
    severityScore = 88;
  }

  let capabilityScore = 85;
  if (text.includes('postgres') || text.includes('prisma') || text.includes('vector') || text.includes('snowflake') || text.includes('ebpf')) {
    capabilityScore = 94;
  }

  let urgencyScore = 82;
  if (text.includes('reboot') || text.includes('bill') || text.includes('auditor') || text.includes('outage') || text.includes('peak')) {
    urgencyScore = 95;
  }

  const buyerAuthority = payload.companyMatch?.buyerPersona?.includes('VP') || payload.companyMatch?.buyerPersona?.includes('Chief') ? 92 : 86;
  const overallScore = Math.round((severityScore * 0.3) + (capabilityScore * 0.3) + (urgencyScore * 0.25) + (buyerAuthority * 0.15));

  return {
    source: 'local',
    score: overallScore,
    scoreBreakdown: {
      technicalSeverity: severityScore,
      capabilityMatch: capabilityScore,
      buyerAuthority,
      urgency: urgencyScore
    },
    explanation: `Calculated signal score based on ${payload.technologies?.length || 2} detected technologies, urgency markers, and persona authority match.`
  };
}

/**
 * Generate outreach via backend POST /api/outreach with local fallback
 */
export async function generateOutreachApi(payload) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/outreach`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return { source: 'api', ...data };
    }
  } catch {
    // Graceful fallback
  }

  const { opportunity, tone = 'consultative', recipient = '' } = payload;
  const companyName = opportunity?.company || 'your team';
  const techList = opportunity?.technologies?.slice(0, 2).join(' & ') || 'your stack';
  const person = recipient || opportunity?.companyMatch?.targetContact?.split(',')[0] || 'there';

  let subject = `Solving ${companyName}'s ${opportunity?.technologies?.[0] || 'technical'} bottleneck`;
  let body = '';

  if (tone === 'technical') {
    subject = `Architecture note: Fix for ${companyName}'s ${opportunity?.technologies?.[0] || 'infrastructure'} issue`;
    body = `Hi ${person},\n\nI reviewed the recent technical thread regarding ${companyName}'s issue with ${opportunity?.problemSummary || 'system degradation'}.\n\nSpecifically, the collision between ${techList} under peak concurrency causes downstream saturation.\n\nWe built an architectural mitigation that decouples this layer, dropping p99 latency overhead to under 1ms with zero code rewrites.\n\nHappy to share a 5-minute technical benchmark or reproduction if you're evaluating options.\n\nBest,\nArjun Mehta\nTechnical Solutions Architect`;
  } else if (tone === 'executive') {
    subject = `Protecting ${companyName}'s operational uptime and engineering velocity`;
    body = `Hi ${person},\n\nAs ${companyName} continues scaling customer workload, platform reliability is foundational to revenue growth.\n\nOur intelligence noticed your engineering team encountering recurring friction with ${opportunity?.title || 'database and cloud scalability'}.\n\nWe help high-growth technology companies eliminate these failure modes before they escalate into customer-facing downtime.\n\nCould we schedule 15 minutes this week for a concise architecture overview?\n\nBest regards,\nArjun Mehta`;
  } else {
    // consultative
    subject = `${companyName}'s ${opportunity?.technologies?.[0] || 'architecture'} challenge (saw public engineering discussion)`;
    body = `Hi ${person},\n\nI saw your engineering team troubleshooting ${opportunity?.problemSummary || 'an infrastructure issue'} on ${opportunity?.source || 'developer forums'}.\n\nThat specific interaction across ${techList} is notoriously tricky at scale because standard pooling and retry logic often exacerbate backpressure.\n\nWe created a dedicated solution for this exact pattern that reduces resource pressure by up to 85% without architectural changes.\n\nWould you be open to a quick peer conversation to compare notes?\n\nBest,\nArjun Mehta\nDarkIntent Intelligence Team`;
  }

  return {
    source: 'local',
    subject,
    body
  };
}
