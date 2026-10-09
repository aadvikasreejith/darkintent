import { LogoGitHub, LogoReddit, LogoHackerNews, LogoStackOverflow, LogoLinkedIn } from './Icons';

export function SourceBadge({ source, channel = '', url = '', showName = true, iconSize = 14 }) {
  const norm = (source || '').toLowerCase();

  let LogoComponent = LogoHackerNews;
  let badgeClass = 'source-hn';

  if (norm.includes('github')) {
    LogoComponent = LogoGitHub;
    badgeClass = 'source-github';
  } else if (norm.includes('reddit')) {
    LogoComponent = LogoReddit;
    badgeClass = 'source-reddit';
  } else if (norm.includes('stack')) {
    LogoComponent = LogoStackOverflow;
    badgeClass = 'source-so';
  } else if (norm.includes('linkedin')) {
    LogoComponent = LogoLinkedIn;
    badgeClass = 'source-linkedin';
  } else if (norm.includes('hacker') || norm.includes('hn')) {
    LogoComponent = LogoHackerNews;
    badgeClass = 'source-hn';
  }

  const content = (
    <span className={`source-badge ${badgeClass}`}>
      <span className="source-brand-logo">
        <LogoComponent size={iconSize} />
      </span>
      {showName && <span className="source-name">{source}</span>}
      {channel && <span className="source-channel">{channel}</span>}
    </span>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-badge-link"
        title={`Open original public discussion on ${source}`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return content;
}
