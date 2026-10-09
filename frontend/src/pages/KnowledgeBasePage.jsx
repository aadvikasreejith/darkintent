import { useState } from 'react';
import { KNOWLEDGE_BASE_DOCS } from '../data/sampleData';
import { IconCopy, IconCheck, IconSearch } from '../components/Icons';

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const filteredDocs = KNOWLEDGE_BASE_DOCS.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.summary || '').toLowerCase().includes(q)
    );
  });

  const handleCopy = (doc) => {
    navigator.clipboard.writeText(`${doc.title}\n\n${doc.summary || ''}\nKey metrics: ${doc.keyMetrics || ''}`);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="knowledge-base-page">
      <div className="page-header-intro">
        <div>
          <h1 className="page-title font-editorial">Knowledge Base</h1>
          <p className="page-subtitle">Product specifications and consultative battlecards.</p>
        </div>
      </div>

      {/* Simple Document List */}
      <div className="card-panel">
        <div className="kb-list-toolbar">
          <div className="search-input-wrap">
            <IconSearch size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search specifications, battlecards, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="kb-doc-count font-mono">{filteredDocs.length} documents</span>
        </div>

        <div className="kb-document-table-wrap">
          <table className="kb-document-table">
            <thead>
              <tr>
                <th style={{ width: '48%' }}>Title</th>
                <th style={{ width: '24%' }}>Type</th>
                <th style={{ width: '14%' }}>Updated</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="kb-document-row">
                  <td>
                    <button
                      type="button"
                      className="kb-doc-title-btn"
                      onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                    >
                      {doc.title}
                    </button>
                    {selectedDoc?.id === doc.id && (
                      <div className="kb-doc-expanded">
                        <p className="kb-doc-summary">{doc.summary}</p>
                        {doc.keyMetrics && (
                          <div className="kb-doc-metrics">
                            <strong>Metrics:</strong> {doc.keyMetrics}
                          </div>
                        )}
                        {doc.supportedStacks && (
                          <div className="kb-doc-stacks">
                            {doc.supportedStacks.map((s) => (
                              <span key={s} className="tech-tag tag-xs">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="kb-type-badge">{doc.category}</span>
                  </td>
                  <td className="kb-updated-col">{doc.lastUpdated}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="kb-row-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleCopy(doc)}
                        title="Copy document summary"
                      >
                        {copiedId === doc.id ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        <span>{copiedId === doc.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                      >
                        {selectedDoc?.id === doc.id ? 'Close' : 'View'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
