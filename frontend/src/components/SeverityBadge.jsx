export function SeverityBadge({ severity }) {
  const normalized = (severity || 'Medium').toLowerCase();
  let badgeClass = 'sev-med';

  if (normalized === 'critical') badgeClass = 'sev-critical';
  else if (normalized === 'high') badgeClass = 'sev-high';
  else if (normalized === 'medium') badgeClass = 'sev-med';
  else if (normalized === 'low') badgeClass = 'sev-low';

  return (
    <span className={`severity-badge ${badgeClass}`}>
      <span className="severity-dot"></span>
      {severity}
    </span>
  );
}
