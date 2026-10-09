export function ScoreBadge({ score, size = 'normal', showLabel = true }) {
  let levelClass = 'score-high';
  let label = 'High Intent';

  if (score >= 90) {
    levelClass = 'score-high';
    label = 'High Intent';
  } else if (score >= 80) {
    levelClass = 'score-med';
    label = 'Qualified';
  } else {
    levelClass = 'score-low';
    label = 'Monitoring';
  }

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div
      className={`score-badge ${levelClass} ${isSmall ? 'score-sm' : ''} ${isLarge ? 'score-lg' : ''}`}
      title={`Intent Score: ${score}/100 (${label})`}
    >
      <span className="score-numeral">{score}</span>
      {showLabel && <span className="score-label">{label}</span>}
    </div>
  );
}
