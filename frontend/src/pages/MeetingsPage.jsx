import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { formatDateIST } from '../data/sampleData';
import {
  IconCalendar,
  IconClock,
  IconVideo,
  IconMapPin,
  IconUsers,
  IconFileText,
  IconSearch,
  IconCheck,
  IconCopy,
  IconPlus,
  IconClose,
  IconSparkles,
  IconDownload,
  IconSheet,
  IconExternalLink
} from '../components/Icons';
/**
 * Safely parses and normalizes external meeting URLs.
 * Ensures absolute HTTPS scheme to prevent React Router from treating
 * domain strings like "meet.google.com/xyz" as relative local routes.
 * Returns null if the string is empty or not a valid URL.
 */
export function getSafeMeetingUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // If already absolute with http/https
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return parsed.href;
      }
    } catch {
      return null;
    }
  }

  // If provided as hostname/path e.g. meet.google.com/abc or zoom.us/j/123
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    try {
      const parsed = new URL(`https://${trimmed}`);
      return parsed.href;
    } catch {
      return null;
    }
  }

  return null;
}

export function MeetingsPage() {
  const [searchParams] = useSearchParams();
  const urlOppId = searchParams.get('oppId') || null;

  const {
    meetings = [],
    opportunities = [],
    addMeeting,
    updateMeeting,
    cancelMeeting,
    saveMeetingNotes,
    exportMeetingsCsv,
    showToast
  } = useOpportunities();

  // Search, Filter & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());

  // Modal States
  const [isScheduleOpen, setIsScheduleOpen] = useState(Boolean(urlOppId));
  const [activeBriefMeeting, setActiveBriefMeeting] = useState(null);
  const [activeNotesMeeting, setActiveNotesMeeting] = useState(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  // Selected Meeting for Details Panel (synchronized across calendar & list)
  const [selectedMeetingId, setSelectedMeetingId] = useState(() => {
    if (urlOppId) {
      const found = meetings.find((m) => m.opportunityId === urlOppId);
      if (found) return found.id;
    }
    return meetings[0]?.id || null;
  });

  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  // Dynamic KPI counts calculated directly from actual meeting records
  const summaryCounts = useMemo(() => {
    const today = meetings.filter((m) => m.date === todayStr && m.status !== 'Cancelled').length;
    const upcoming = meetings.filter((m) => m.date >= todayStr && m.status !== 'Cancelled' && m.status !== 'Completed').length;
    const completed = meetings.filter((m) => m.status === 'Completed').length;
    const cancelled = meetings.filter((m) => m.status === 'Cancelled').length;
    return { today, upcoming, completed, cancelled };
  }, [meetings, todayStr]);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCompany = (m.company || '').toLowerCase().includes(q);
        const mProspect = (m.prospectName || '').toLowerCase().includes(q);
        const mTitle = (m.title || '').toLowerCase().includes(q);
        if (!mCompany && !mProspect && !mTitle) return false;
      }
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      return true;
    });
  }, [meetings, searchQuery, statusFilter]);

  // Sync selected meeting object
  const selectedMeeting = useMemo(() => {
    return meetings.find((m) => m.id === selectedMeetingId) || meetings[0] || null;
  }, [meetings, selectedMeetingId]);

  // Upcoming meetings list (sorted ascending by date/time)
  const upcomingList = useMemo(() => {
    return [...filteredMeetings]
      .filter((m) => m.status !== 'Cancelled' && m.status !== 'Completed')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [filteredMeetings]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleTodayMonth = () => {
    setCurrentMonthDate(new Date());
  };

  const handleCopyLink = (m) => {
    const text = m.locationOrLink || `Meeting with ${m.prospectName} (${m.company})`;
    navigator.clipboard.writeText(text);
    showToast('Meeting link copied to clipboard', 'success');
  };

  const handleCopyInvite = (m) => {
    const text = m.invitationDraft || `Meeting: ${m.title}\nDate: ${m.date} at ${m.time} (${m.timezone})\nDuration: ${m.durationMinutes} min\nLink: ${m.locationOrLink}`;
    navigator.clipboard.writeText(text);
    showToast('Meeting invitation copied to clipboard', 'success');
  };

  // Calendar cells computation for current displayed month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month];

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells = [];
    const blankCount = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < blankCount; i++) {
      cells.push({ dayNum: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr });
    }
    return cells;
  }, [year, month, firstDay, daysInMonth]);

  return (
    <div className="meetings-page-container">
      {/* 1. Page Header */}
      <header className="meetings-header">
        <div className="meetings-header-text">
          <h1 className="meetings-title font-editorial">Meetings</h1>
          <p className="meetings-subtitle">Turn conversations into opportunities.</p>
        </div>

        <div className="meetings-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsSheetsModalOpen(true)}
            title="Export CSV / Google Sheets"
          >
            <IconSheet size={14} />
            <span>Sync Sheets</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsCalendarModalOpen(true)}
            title="Google Calendar Integration"
          >
            <IconCalendar size={14} />
            <span>Google Calendar</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm btn-new-meeting"
            onClick={() => setIsScheduleOpen(true)}
          >
            <IconPlus size={14} />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </header>

      {/* 2. Four Summary KPI Cards (Dynamically calculated) */}
      <div className="meetings-summary-cards">
        <div className="summary-card-metric card-today">
          <span className="kpi-label">Today's Meetings</span>
          <span className="kpi-value font-editorial">{summaryCounts.today}</span>
        </div>
        <div className="summary-card-metric card-upcoming">
          <span className="kpi-label">Upcoming</span>
          <span className="kpi-value font-editorial">{summaryCounts.upcoming}</span>
        </div>
        <div className="summary-card-metric card-completed">
          <span className="kpi-label">Completed</span>
          <span className="kpi-value font-editorial">{summaryCounts.completed}</span>
        </div>
        <div className="summary-card-metric card-cancelled">
          <span className="kpi-label">Cancelled</span>
          <span className="kpi-value font-editorial">{summaryCounts.cancelled}</span>
        </div>
      </div>

      {/* 3. Two-Column Workspace Layout */}
      <div className="meetings-workspace-grid">
        {/* Left Column: Calendar & Upcoming List */}
        <div className="meetings-left-col">
          {/* Toolbar */}
          <div className="meetings-toolbar-row">
            <div className="meetings-view-toggle-btns">
              <button
                type="button"
                className={`view-toggle-pill ${viewMode === 'calendar' ? 'pill-active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
              <button
                type="button"
                className={`view-toggle-pill ${viewMode === 'list' ? 'pill-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>

            {/* Month Navigation */}
            <div className="month-nav-controls">
              <button
                type="button"
                className="month-nav-btn"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                title="Previous month"
              >
                ‹
              </button>
              <span className="month-nav-label font-editorial">
                {monthName} {year}
              </span>
              <button
                type="button"
                className="month-nav-btn"
                onClick={handleNextMonth}
                aria-label="Next month"
                title="Next month"
              >
                ›
              </button>
              <button
                type="button"
                className="btn btn-subtle btn-xs"
                onClick={handleTodayMonth}
                style={{ marginLeft: '4px' }}
              >
                Today
              </button>
            </div>

            {/* Search and Status */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search meetings..."
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '5px 10px', width: '160px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="form-select"
                style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Awaiting Confirmation">Awaiting</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Calendar Grid View */}
          {viewMode === 'calendar' && (
            <div className="calendar-month-container card-panel">
              <div className="month-days-header">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d} className="month-day-col-title">{d}</span>
                ))}
              </div>

              <div className="month-grid">
                {calendarCells.map((cell, idx) => {
                  if (!cell.dayNum) {
                    return <div key={`blank-${idx}`} className="month-cell cell-empty" />;
                  }

                  const dayMeetings = filteredMeetings.filter((m) => m.date === cell.dateStr);
                  const isToday = cell.dateStr === todayStr;

                  return (
                    <div
                      key={cell.dateStr}
                      className={`month-cell ${isToday ? 'cell-today' : ''}`}
                      onClick={() => {
                        if (dayMeetings.length > 0) {
                          setSelectedMeetingId(dayMeetings[0].id);
                        }
                      }}
                    >
                      <span className="cell-day-num">{cell.dayNum}</span>
                      <div className="cell-chips-wrap">
                        {dayMeetings.map((m) => {
                          const isSelected = m.id === selectedMeetingId;
                          return (
                            <div
                              key={m.id}
                              className={`month-event-chip ${isSelected ? 'chip-selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMeetingId(m.id);
                              }}
                              style={{
                                border: isSelected ? '1px solid var(--forest-800)' : undefined,
                                fontWeight: isSelected ? 700 : undefined
                              }}
                              title={`${m.time} - ${m.company} (${m.status})`}
                            >
                              <span className="m-chip-time">{m.time}</span>
                              <span className="m-chip-name">{m.company}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Meetings List / Table */}
          <div className="upcoming-table-container">
            <div className="upcoming-table-header">
              <div>
                <h3 className="upcoming-table-title font-editorial">Upcoming Meetings</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                  {upcomingList.length} scheduled session{upcomingList.length !== 1 ? 's' : ''}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setIsViewAllOpen(true)}
              >
                <span>View All ({meetings.length})</span>
                <IconExternalLink size={12} />
              </button>
            </div>

            {upcomingList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {upcomingList.map((m) => {
                  const isSelected = m.id === selectedMeetingId;
                  return (
                    <div
                      key={m.id}
                      className={`meeting-list-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => setSelectedMeetingId(m.id)}
                    >
                      <div className="meeting-row-left">
                        <div className="meeting-row-avatar">
                          {m.company?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="meeting-row-info">
                          <span className="meeting-row-title">{m.title}</span>
                          <span className="meeting-row-meta">
                            <strong>{m.company}</strong> · {m.prospectName} · {formatDateIST(m.date)} at {m.time}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`status-pill status-${(m.status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {m.status}
                        </span>
                        {m.meetingType === 'Online' ? (
                          <span title="Online Video Meeting" style={{ color: 'var(--forest-600)' }}>
                            <IconVideo size={14} />
                          </span>
                        ) : (
                          <span title="In-person Meeting" style={{ color: 'var(--ink-500)' }}>
                            <IconMapPin size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-500)', fontSize: '0.85rem' }}>
                No upcoming meetings match the current filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Synchronized Selected Meeting Details Panel */}
        <div className="meetings-right-col">
          {selectedMeeting ? (
            <div className="meeting-details-panel">
              <div className="details-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    className={`status-pill status-${(selectedMeeting.status || '').toLowerCase().replace(/\s+/g, '-')}`}
                    style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
                  >
                    {selectedMeeting.status}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#bed6c7', fontFamily: 'var(--font-mono)' }}>
                    ID: {selectedMeeting.id}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0', color: '#ffffff' }}>
                  {selectedMeeting.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#bed6c7', margin: 0 }}>
                  {selectedMeeting.company} · {selectedMeeting.meetingType || 'Online Video'}
                </p>
              </div>

              <div className="details-panel-body">
                {/* Date & Time Grid */}
                <div className="details-info-grid">
                  <div>
                    <span className="details-info-k">Date & Time</span>
                    <div className="details-info-v font-mono">{formatDateIST(selectedMeeting.date)} at {selectedMeeting.time}</div>
                  </div>
                  <div>
                    <span className="details-info-k">Duration</span>
                    <div className="details-info-v">{selectedMeeting.durationMinutes} mins ({selectedMeeting.timezone || 'IST'})</div>
                  </div>
                  <div>
                    <span className="details-info-k">Prospect Lead</span>
                    <div className="details-info-v">{selectedMeeting.prospectName}</div>
                    {selectedMeeting.prospectTitle && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--ink-500)' }}>{selectedMeeting.prospectTitle}</div>
                    )}
                  </div>
                  <div>
                    <span className="details-info-k">Prospect Email</span>
                    <div className="details-info-v font-mono" style={{ fontSize: '0.78rem' }}>{selectedMeeting.prospectEmail || 'Not specified'}</div>
                  </div>
                </div>

                {/* Linked Opportunity */}
                {selectedMeeting.opportunityId && (
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase' }}>Linked Technical Signal</span>
                    <div style={{ marginTop: '4px' }}>
                      <Link to={`/opportunity/${selectedMeeting.opportunityId}`} style={{ color: 'var(--forest-700)', fontWeight: 600, fontSize: '0.86rem', textDecoration: 'underline' }}>
                        #{selectedMeeting.opportunityId} — View Opportunity Detail →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Join Meeting Action (With getSafeMeetingUrl Fix!) */}
                <div className="join-action-block">
                  {selectedMeeting.meetingType === 'Online' ? (
                    (() => {
                      const safeJoinUrl = getSafeMeetingUrl(selectedMeeting.locationOrLink);
                      if (safeJoinUrl) {
                        return (
                          <a
                            href={safeJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-join-meeting"
                            id={`btn-join-${selectedMeeting.id}`}
                          >
                            <IconVideo size={16} />
                            <span>Join Meeting Now</span>
                            <IconExternalLink size={14} />
                          </a>
                        );
                      }
                      return (
                        <button
                          type="button"
                          disabled
                          className="btn-join-disabled"
                          title="No valid video meeting URL has been configured for this event. Edit meeting to add one."
                        >
                          <IconVideo size={16} />
                          <span>Join Link Unavailable (No URL set)</span>
                        </button>
                      );
                    })()
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <IconMapPin size={18} style={{ color: 'var(--forest-600)' }} />
                      <div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase' }}>In-Person Meeting Location:</span>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-900)' }}>
                          {selectedMeeting.locationOrLink || 'Office Conference Room'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-Call Intelligence Brief Snippet */}
                {selectedMeeting.brief && (
                  <div style={{ background: 'var(--forest-50)', border: '1px solid var(--forest-200)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--forest-800)', textTransform: 'uppercase' }}>Pre-Call Discovery Objective</span>
                      <button
                        type="button"
                        onClick={() => setActiveBriefMeeting(selectedMeeting)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--forest-700)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Open Full Brief →
                      </button>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--forest-950)', margin: 0, lineHeight: 1.45 }}>
                      {selectedMeeting.brief.suggestedObjectives || selectedMeeting.brief.problemSummary}
                    </p>
                  </div>
                )}

                {/* Post-Call Notes Snippet */}
                <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase' }}>Post-Call Debrief & Actions</span>
                    <button
                      type="button"
                      onClick={() => setActiveNotesMeeting(selectedMeeting)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--forest-700)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {selectedMeeting.notes?.discussionSummary ? 'Edit Notes →' : 'Record Notes →'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-700)', margin: 0, fontStyle: selectedMeeting.notes?.discussionSummary ? 'normal' : 'italic' }}>
                    {selectedMeeting.notes?.discussionSummary || 'No post-call debrief notes recorded yet.'}
                  </p>
                </div>

                {/* Quick Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyInvite(selectedMeeting)}
                    className="btn btn-outline btn-xs"
                    style={{ flex: 1 }}
                  >
                    <IconCopy size={13} />
                    <span>Copy Invite</span>
                  </button>
                  {selectedMeeting.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => cancelMeeting(selectedMeeting.id)}
                      className="btn btn-outline btn-xs text-danger"
                      style={{ flex: 1 }}
                    >
                      <IconClose size={13} />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <IconCalendar size={28} style={{ color: 'var(--ink-400)', margin: '0 auto 10px', display: 'block' }} />
              <h4 style={{ color: 'var(--ink-800)', margin: '0 0 6px 0' }}>No Meeting Selected</h4>
              <p style={{ color: 'var(--ink-500)', fontSize: '0.84rem' }}>Click on any meeting event or row to view its details, join link, and brief.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: View All Meetings Archive */}
      {isViewAllOpen && (
        <ViewAllMeetingsModal
          meetings={meetings}
          onSelectMeeting={(m) => setSelectedMeetingId(m.id)}
          onClose={() => setIsViewAllOpen(false)}
          onOpenBrief={(m) => setActiveBriefMeeting(m)}
          onOpenNotes={(m) => setActiveNotesMeeting(m)}
        />
      )}

      {/* Modal: Schedule Meeting */}
      {isScheduleOpen && (
        <ScheduleMeetingModal
          opportunities={opportunities}
          initialOppId={urlOppId}
          onClose={() => setIsScheduleOpen(false)}
          onSchedule={(data) => {
            addMeeting(data);
            setIsScheduleOpen(false);
          }}
        />
      )}

      {/* Modal: Pre-Meeting Brief Intelligence */}
      {activeBriefMeeting && (
        <MeetingBriefModal
          meeting={activeBriefMeeting}
          opportunities={opportunities}
          onClose={() => setActiveBriefMeeting(null)}
          onOpenNotes={() => {
            const m = activeBriefMeeting;
            setActiveBriefMeeting(null);
            setActiveNotesMeeting(m);
          }}
        />
      )}

      {/* Modal: Post-Meeting Notes & Follow-through */}
      {activeNotesMeeting && (
        <MeetingNotesModal
          meeting={activeNotesMeeting}
          onClose={() => setActiveNotesMeeting(null)}
          onSaveNotes={(notes) => {
            saveMeetingNotes(activeNotesMeeting.id, notes);
            setActiveNotesMeeting(null);
          }}
        />
      )}

      {/* Modal: Google Calendar Sync Boundary */}
      {isCalendarModalOpen && (
        <CalendarSyncModal onClose={() => setIsCalendarModalOpen(false)} />
      )}

      {/* Modal: Google Sheets Sync Boundary */}
      {isSheetsModalOpen && (
        <GoogleSheetsSyncModal
          onClose={() => setIsSheetsModalOpen(false)}
          onExportCsv={exportMeetingsCsv}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// View All Meetings Modal Component
// ---------------------------------------------------------------------------
function ViewAllMeetingsModal({
  meetings,
  onSelectMeeting,
  onClose,
  onOpenBrief,
  onOpenNotes
}) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const displayed = useMemo(() => {
    return meetings.filter((m) => {
      if (filter !== 'All' && m.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (m.company || '').toLowerCase().includes(q) ||
          (m.prospectName || '').toLowerCase().includes(q) ||
          (m.title || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [meetings, filter, search]);

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window" style={{ maxWidth: '850px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">
            <IconCalendar size={18} />
          </div>
          <div>
            <h2 className="modal-title font-editorial">All Meetings ({meetings.length})</h2>
            <p className="modal-subtitle">Full historical and scheduled discovery calls directory</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Search all meetings by company or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Awaiting Confirmation">Awaiting Confirmation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="modal-body-scroll" style={{ maxHeight: '480px', padding: '16px 20px' }}>
          {displayed.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {displayed.map((m) => (
                <div
                  key={m.id}
                  className="meeting-list-row"
                  style={{ border: '1px solid var(--border-subtle)' }}
                  onClick={() => {
                    onSelectMeeting(m);
                    onClose();
                  }}
                >
                  <div className="meeting-row-left">
                    <div className="meeting-row-avatar">
                      {m.company?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="meeting-row-info">
                      <span className="meeting-row-title">{m.title}</span>
                      <span className="meeting-row-meta">
                        <strong>{m.company}</strong> · {m.prospectName} · {formatDateIST(m.date)} at {m.time}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`status-pill status-${(m.status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {m.status}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBrief(m);
                      }}
                    >
                      Brief
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-500)' }}>
              No meetings found matching current search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Single Meeting Card Component
// ---------------------------------------------------------------------------
function MeetingCard({
  meeting,
  isToday = false,
  isPast = false,
  onOpenBrief,
  onOpenNotes,
  onCopyLink,
  onCopyInvite,
  onUpdateStatus,
  onCancel
}) {
  const statusClass = {
    Confirmed: 'status-confirmed',
    'Awaiting Confirmation': 'status-awaiting',
    Proposed: 'status-proposed',
    Completed: 'status-completed',
    Cancelled: 'status-cancelled'
  }[meeting.status] || 'status-default';

  return (
    <div className={`meeting-card card-panel ${isToday ? 'meeting-card-today' : ''} ${isPast ? 'meeting-card-past' : ''}`}>
      {/* Top Meta Bar */}
      <div className="meeting-card-top">
        <div className="meeting-datetime">
          <span className="meeting-date font-medium">{formatDateIST(meeting.date)}</span>
          <span className="meeting-time-pill font-mono">
            <IconClock size={12} />
            {meeting.time} ({meeting.durationMinutes}m)
          </span>
        </div>

        <select
          className={`meeting-status-badge ${statusClass}`}
          value={meeting.status}
          onChange={(e) => onUpdateStatus?.(e.target.value)}
          title="Click to change meeting status"
          aria-label="Meeting Status"
        >
          <option value="Confirmed">Confirmed</option>
          <option value="Awaiting Confirmation">Awaiting Confirmation</option>
          <option value="Proposed">Proposed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Company & Topic Title */}
      <div className="meeting-card-body">
        <div className="meeting-company-line">
          <span className="meeting-company-name font-editorial">{meeting.company}</span>
          {meeting.meetingType === 'Online' ? (
            <span className="meeting-type-tag type-online" title="Online Video Conference">
              <IconVideo size={12} /> Online
            </span>
          ) : (
            <span className="meeting-type-tag type-inperson" title="In-person meeting">
              <IconMapPin size={12} /> In-person
            </span>
          )}
        </div>

        <h3 className="meeting-topic-title">{meeting.title}</h3>

        {/* Prospect details */}
        <div className="meeting-prospect-line">
          <IconUsers size={13} className="prospect-icon" />
          <span className="prospect-name">{meeting.prospectName}</span>
          {meeting.prospectTitle && (
            <span className="prospect-role">· {meeting.prospectTitle}</span>
          )}
        </div>

        {/* Notes snippet if completed */}
        {meeting.notes?.discussionSummary && (
          <div className="meeting-notes-preview">
            <span className="notes-tag">Notes:</span> {meeting.notes.discussionSummary.slice(0, 110)}...
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="meeting-card-footer">
        <div className="meeting-footer-left">
          <button
            type="button"
            className="btn btn-outline btn-xs btn-brief"
            onClick={onOpenBrief}
            title="Evidence-backed intelligence brief for this call"
          >
            <IconSparkles size={13} />
            <span>Meeting Brief</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-xs btn-notes"
            onClick={onOpenNotes}
            title="Record post-call notes and generate follow-up"
          >
            <IconFileText size={13} />
            <span>{meeting.notes?.discussionSummary ? 'Edit Notes' : 'Post-Call Notes'}</span>
          </button>
        </div>

        <div className="meeting-footer-right">
          <button
            type="button"
            className="icon-action-btn"
            onClick={onCopyInvite}
            title="Copy personalized invitation draft"
          >
            <IconCopy size={13} />
          </button>

          {meeting.locationOrLink && (
            <button
              type="button"
              className="icon-action-btn"
              onClick={onCopyLink}
              title="Copy meeting link"
            >
              <IconVideo size={13} />
            </button>
          )}

          {meeting.opportunityId && (
            <Link
              to={`/opportunity/${meeting.opportunityId}`}
              className="icon-action-btn"
              title="View linked opportunity signal"
            >
              <IconExternalLink size={13} />
            </Link>
          )}

          {meeting.status !== 'Cancelled' && (
            <button
              type="button"
              className="icon-action-btn text-danger"
              onClick={onCancel}
              title="Cancel meeting"
            >
              <IconClose size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Meeting Modal (4 Steps Flow)
// ---------------------------------------------------------------------------
function ScheduleMeetingModal({ opportunities, initialOppId, onClose, onSchedule }) {
  const [selectedOppId, setSelectedOppId] = useState(() => {
    if (initialOppId && opportunities.some((o) => o.id === initialOppId)) {
      return initialOppId;
    }
    return opportunities[0]?.id || '';
  });
  const selectedOpp = opportunities.find((o) => o.id === selectedOppId) || opportunities[0];

  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState('15:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingType, setMeetingType] = useState('Online');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [locationOrLink, setLocationOrLink] = useState('https://meet.google.com/dkt-intel-call');
  const [title, setTitle] = useState(
    selectedOpp ? `Architecture Review: ${selectedOpp.company}'s ${selectedOpp.technologies?.[0] || 'Infrastructure'}` : 'Introductory Technical Discovery'
  );
  const [prospectName, setProspectName] = useState(selectedOpp?.companyMatch?.targetContact?.split(',')[0] || 'Technical Lead');
  const [prospectEmail, setProspectEmail] = useState(selectedOpp?.companyMatch?.contactEmail || '');
  const [meetingStatus, setMeetingStatus] = useState('Confirmed');
  const [invitationMessage, setInvitationMessage] = useState(
    `Hi ${prospectName},\n\nLooking forward to our conversation regarding ${selectedOpp?.company}'s ${selectedOpp?.technologies?.[0] || 'system'} scalability challenges.\n\nProposed Time: ${time} (${timezone})\nMeeting Link: ${locationOrLink}\n\nBest regards,\nDarkIntent Intelligence Team`
  );

  const handleOppChange = (oppId) => {
    setSelectedOppId(oppId);
    const opp = opportunities.find((o) => o.id === oppId);
    if (opp) {
      setTitle(`Architecture Review: ${opp.company}'s ${opp.technologies?.[0] || 'Infrastructure'}`);
      setProspectName(opp.companyMatch?.targetContact?.split(',')[0] || 'Engineering Lead');
      setProspectEmail(opp.companyMatch?.contactEmail || '');
      setInvitationMessage(
        `Hi ${opp.companyMatch?.targetContact?.split(',')[0] || 'there'},\n\nLooking forward to our conversation regarding ${opp.company}'s ${opp.technologies?.[0] || 'system'} scalability challenges.\n\nProposed Time: ${time} (${timezone})\nMeeting Link: ${locationOrLink}\n\nBest regards,\nDarkIntent Intelligence Team`
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSchedule({
      opportunityId: selectedOppId,
      company: selectedOpp?.company || 'Target Organization',
      prospectName,
      prospectEmail,
      title,
      date,
      time,
      durationMinutes: Number(durationMinutes),
      meetingType,
      timezone,
      locationOrLink,
      status: meetingStatus,
      invitationDraft: invitationMessage,
      brief: {
        problemSummary: selectedOpp?.problemSummary || 'Technical operational challenge identified in developer community.',
        sourcePlatform: selectedOpp?.source || 'Public Developer Discussion',
        evidenceLink: selectedOpp?.evidenceLink || selectedOpp?.sourceUrl || '',
        whyItMatters: `High priority operational impact on ${selectedOpp?.company || 'company'} workload.`,
        recommendedCapabilities: selectedOpp?.technologies?.join(', ') || 'Infrastructure Automation',
        matchingRationale: 'Direct match with product core reliability module.',
        discoveryQuestions: [
          'What is the current operational impact of this bottleneck during peak traffic?',
          'What architecture mitigations has your engineering team tested so far?',
          'Who are the key decision makers for infrastructure reliability tooling?'
        ],
        suggestedObjectives: 'Validate failure mode reproduction and establish sandbox testing timeline.'
      }
    });
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window schedule-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">
            <IconCalendar size={18} />
          </div>
          <div>
            <h2 className="modal-title font-editorial">Schedule Sales Meeting</h2>
            <p className="modal-subtitle">Connect prospect context directly into your sales pipeline.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body-scroll">
            {/* Step 1: Select Opportunity & Prospect */}
            <div className="form-section-group">
              <span className="form-section-title">1. Target Prospect & Opportunity Context</span>
              <div className="form-row-2col">
                <div className="form-field">
                  <label htmlFor="schedule-opp-select" className="form-label">Associated Opportunity</label>
                  <select
                    id="schedule-opp-select"
                    className="form-input"
                    value={selectedOppId}
                    onChange={(e) => handleOppChange(e.target.value)}
                  >
                    {opportunities.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.company} — {o.technologies?.[0] || 'Tech'} ({o.location || 'India'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-title" className="form-label">Meeting Topic / Title</label>
                  <input
                    id="schedule-title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label htmlFor="schedule-contact-name" className="form-label">Contact Name</label>
                  <input
                    id="schedule-contact-name"
                    type="text"
                    className="form-input"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="Arunav Sengupta"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-contact-email" className="form-label">Contact Email</label>
                  <input
                    id="schedule-contact-email"
                    type="email"
                    className="form-input"
                    value={prospectEmail}
                    onChange={(e) => setProspectEmail(e.target.value)}
                    placeholder="arunav@company.in"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Date, Time & Availability */}
            <div className="form-section-group">
              <span className="form-section-title">2. Date, Time & Location</span>
              <div className="form-row-3col">
                <div className="form-field">
                  <label htmlFor="schedule-date" className="form-label">Date</label>
                  <input
                    id="schedule-date"
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-time" className="form-label">Time</label>
                  <input
                    id="schedule-time"
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-duration" className="form-label">Duration</label>
                  <select
                    id="schedule-duration"
                    className="form-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-row-3col">
                <div className="form-field">
                  <label htmlFor="schedule-type" className="form-label">Meeting Type</label>
                  <select
                    id="schedule-type"
                    className="form-input"
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                  >
                    <option value="Online">Online Video Conference</option>
                    <option value="In-person">In-Person Meeting</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-tz" className="form-label">Timezone</label>
                  <select
                    id="schedule-tz"
                    className="form-input font-mono text-xs"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="US/Eastern">US/Eastern (EST)</option>
                    <option value="US/Pacific">US/Pacific (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="schedule-link" className="form-label">Meeting URL or Location</label>
                  <input
                    id="schedule-link"
                    type="text"
                    className="form-input"
                    value={locationOrLink}
                    onChange={(e) => setLocationOrLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Personalized Invitation Preview */}
            <div className="form-section-group">
              <span className="form-section-title">3. Personalized Meeting Invitation</span>
              <div className="form-field">
                <label htmlFor="schedule-invite" className="form-label">Invitation Text (Editable)</label>
                <textarea
                  id="schedule-invite"
                  rows={4}
                  className="form-input font-sans text-sm"
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="schedule-status" className="form-label">Initial Booking Status</label>
                <select
                  id="schedule-status"
                  className="form-input"
                  value={meetingStatus}
                  onChange={(e) => setMeetingStatus(e.target.value)}
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Proposed">Proposed (Awaiting slot agreement)</option>
                  <option value="Awaiting Confirmation">Awaiting Prospect Confirmation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Confirm & Book Meeting →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pre-Meeting Brief Modal (Meeting Intelligence)
// ---------------------------------------------------------------------------
function MeetingBriefModal({ meeting, opportunities, onClose, onOpenNotes }) {
  const linkedOpp = opportunities.find((o) => o.id === meeting.opportunityId);

  const brief = meeting.brief || {
    problemSummary: linkedOpp?.problemSummary || 'High priority technical degradation reported in public developer channels.',
    sourcePlatform: linkedOpp?.source || 'Developer Community',
    evidenceLink: linkedOpp?.evidenceLink || linkedOpp?.sourceUrl || '',
    whyItMatters: `Direct uptime and latency SLA exposure for ${meeting.company}'s customer transactions.`,
    recommendedCapabilities: linkedOpp?.technologies?.join(', ') || 'Cloud Infrastructure & Observability',
    discoveryQuestions: [
      'What is your target resolution timeframe for this bottleneck?',
      'How does this current failure mode impact your engineering sprint velocity?',
      'What are your primary criteria when evaluating infrastructure tooling?'
    ],
    suggestedObjectives: 'Validate technical fit and establish next step for 15-minute proof-of-concept.'
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window brief-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon brief-icon-gold">
            <IconSparkles size={18} />
          </div>
          <div>
            <span className="modal-tag">Pre-Call Intelligence Brief</span>
            <h2 className="modal-title font-editorial">{meeting.company} — {meeting.title}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body-scroll brief-body">
          {/* Executive Overview Pill */}
          <div className="brief-overview-bar">
            <div>
              <span className="brief-meta-label">Prospect</span>
              <span className="brief-meta-val font-medium">{meeting.prospectName} ({meeting.prospectTitle || 'Contact'})</span>
            </div>
            <div>
              <span className="brief-meta-label">Call Time</span>
              <span className="brief-meta-val font-mono">{formatDateIST(meeting.date)} · {meeting.time} ({meeting.timezone})</span>
            </div>
            <div>
              <span className="brief-meta-label">Duration</span>
              <span className="brief-meta-val">{meeting.durationMinutes} mins</span>
            </div>
          </div>

          {/* Section 1: Original Technical Signal */}
          <div className="brief-card-block">
            <h3 className="brief-block-title">1. Original Technical Signal Evidence</h3>
            <div className="brief-text-panel">
              <p className="brief-summary-text">{brief.problemSummary}</p>
              {brief.evidenceLink && (
                <div className="brief-evidence-link-row">
                  <span className="evidence-tag">Verified Source:</span>
                  <a
                    href={brief.evidenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brief-link"
                  >
                    {brief.sourcePlatform} Discussion Thread <IconExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Why it matters to the prospect */}
          <div className="brief-card-block">
            <h3 className="brief-block-title">2. Business Urgency & Operational Impact</h3>
            <p className="brief-paragraph">{brief.whyItMatters}</p>
          </div>

          {/* Section 3: Recommended Product Capabilities & Match Rationale */}
          <div className="brief-card-block">
            <h3 className="brief-block-title">3. Product Capability Match & Positioning</h3>
            <div className="brief-tags-row">
              {(linkedOpp?.technologies || ['Cloud Security', 'eBPF Isolation']).map((t) => (
                <span key={t} className="tag-pill">{t}</span>
              ))}
            </div>
            <p className="brief-match-rationale">
              <strong>Match Rationale: </strong>
              {brief.matchingRationale || 'Automated detection aligns with customer bottleneck without requiring architectural rewrite.'}
            </p>
          </div>

          {/* Section 4: 3 AI Discovery Questions */}
          <div className="brief-card-block">
            <h3 className="brief-block-title">4. Recommended Discovery Questions</h3>
            <ol className="brief-questions-list">
              {(brief.discoveryQuestions || []).map((q, idx) => (
                <li key={idx} className="brief-question-item">
                  <span className="question-num">{idx + 1}.</span>
                  <span className="question-text">{q}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Section 5: Suggested Call Objectives */}
          <div className="brief-card-block">
            <h3 className="brief-block-title">5. Suggested Meeting Objectives</h3>
            <p className="brief-paragraph">{brief.suggestedObjectives}</p>
          </div>
        </div>

        <div className="modal-footer">
          {meeting.locationOrLink && (
            <a
              href={meeting.locationOrLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              <IconVideo size={14} />
              <span>Join Meeting URL</span>
            </a>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenNotes}
          >
            <IconFileText size={14} />
            <span>Proceed to Post-Call Notes →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post-Meeting Notes & Follow-through Modal
// ---------------------------------------------------------------------------
function MeetingNotesModal({ meeting, onClose, onSaveNotes }) {
  const [discussionSummary, setDiscussionSummary] = useState(meeting.notes?.discussionSummary || '');
  const [technicalRequirements, setTechnicalRequirements] = useState(meeting.notes?.technicalRequirements || '');
  const [painPoints, setPainPoints] = useState(meeting.notes?.painPoints || '');
  const [objections, setObjections] = useState(meeting.notes?.objections || '');
  const [agreedActions, setAgreedActions] = useState(meeting.notes?.agreedActions || '');
  const [responsiblePerson, setResponsiblePerson] = useState(meeting.notes?.responsiblePerson || 'Arjun Mehta');
  const [followUpDate, setFollowUpDate] = useState(meeting.notes?.followUpDate || '');
  const [proposedStage, setProposedStage] = useState(meeting.notes?.proposedStage || 'Engaged');

  // Follow-up Email Draft State
  const [followUpDraft, setFollowUpDraft] = useState('');
  const [isCopiedFollowup, setIsCopiedFollowup] = useState(false);

  const handleGenerateFollowUp = () => {
    const text = `Subject: Great speaking with you today, ${meeting.prospectName.split(' ')[0]} — ${meeting.company} next steps\n\nHi ${meeting.prospectName.split(' ')[0]},\n\nThank you for taking the time to speak today regarding ${meeting.company}'s infrastructure scaling priorities.\n\nTo recap our discussion:\n• Core Focus: ${discussionSummary || 'Evaluating automated cloud security and connection optimization.'}\n• Technical Requirements: ${technicalRequirements || 'Zero-code rewrite deployment with latency under 1ms.'}\n• Next Step: ${agreedActions || 'We will prepare benchmark data and follow up before ' + (followUpDate || 'the end of this week') + '.'}\n\nLet me know if I missed anything key.\n\nBest regards,\n${responsiblePerson}\nDarkIntent Intelligence Team`;
    setFollowUpDraft(text);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(followUpDraft);
    setIsCopiedFollowup(true);
    setTimeout(() => setIsCopiedFollowup(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveNotes({
      discussionSummary,
      technicalRequirements,
      painPoints,
      objections,
      agreedActions,
      responsiblePerson,
      followUpDate,
      proposedStage,
      followUpDraft
    });
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window notes-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon notes-icon-green">
            <IconFileText size={18} />
          </div>
          <div>
            <span className="modal-tag">Post-Call Notes & Action Items</span>
            <h2 className="modal-title font-editorial">{meeting.company} — Meeting Record</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body-scroll notes-body">
            {/* 1. Discussion Summary */}
            <div className="form-field">
              <label htmlFor="notes-summary" className="form-label">Discussion Summary</label>
              <textarea
                id="notes-summary"
                rows={3}
                className="form-input"
                placeholder="Key conversation highlights, client sentiments, stakeholder reactions..."
                value={discussionSummary}
                onChange={(e) => setDiscussionSummary(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2col">
              {/* 2. Technical Requirements */}
              <div className="form-field">
                <label htmlFor="notes-requirements" className="form-label">Technical Requirements</label>
                <textarea
                  id="notes-requirements"
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Must support AWS EKS, p99 under 2ms, ISO 27001..."
                  value={technicalRequirements}
                  onChange={(e) => setTechnicalRequirements(e.target.value)}
                />
              </div>

              {/* 3. Objections & Blockers */}
              <div className="form-field">
                <label htmlFor="notes-objections" className="form-label">Objections / Open Questions</label>
                <textarea
                  id="notes-objections"
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Budget cycle begins Q1, concerned about vendor lock-in..."
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                />
              </div>
            </div>

            {/* Pain Points & Responsible Person */}
            <div className="form-row-2col">
              <div className="form-field">
                <label htmlFor="notes-painpoints" className="form-label">Client Pain Points</label>
                <input
                  id="notes-painpoints"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Latency spikes on checkout, OOM on replica..."
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="notes-responsible" className="form-label">Responsible Person (Account Owner)</label>
                <input
                  id="notes-responsible"
                  type="text"
                  className="form-input"
                  placeholder="Arjun Mehta"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                />
              </div>
            </div>

            {/* 4. Agreed Actions & Pipeline Advancement */}
            <div className="form-row-3col">
              <div className="form-field">
                <label htmlFor="notes-actions" className="form-label">Agreed Actions</label>
                <input
                  id="notes-actions"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Send technical POC proposal"
                  value={agreedActions}
                  onChange={(e) => setAgreedActions(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="notes-followup-date" className="form-label">Follow-up Target Date</label>
                <input
                  id="notes-followup-date"
                  type="date"
                  className="form-input"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="notes-stage" className="form-label">Advance Pipeline Stage</label>
                <select
                  id="notes-stage"
                  className="form-input font-medium"
                  value={proposedStage}
                  onChange={(e) => setProposedStage(e.target.value)}
                >
                  <option value="Meeting">Meeting (In progress)</option>
                  <option value="Engaged">Engaged (Active POC / Follow-up)</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Won/Lost">Won / Closed Deal</option>
                </select>
              </div>
            </div>

            {/* Follow-up Email Generator */}
            <div className="followup-generator-box card-panel">
              <div className="generator-top">
                <div className="generator-label-wrap">
                  <IconSparkles size={14} className="sparkle-icon" />
                  <span className="generator-label font-medium">Automated Follow-up Email Generator</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={handleGenerateFollowUp}
                >
                  Generate Draft
                </button>
              </div>

              {followUpDraft && (
                <div className="followup-draft-area">
                  <textarea
                    rows={6}
                    className="form-input font-sans text-xs"
                    value={followUpDraft}
                    onChange={(e) => setFollowUpDraft(e.target.value)}
                  />
                  <div className="draft-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={handleCopyDraft}
                    >
                      {isCopiedFollowup ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      <span>{isCopiedFollowup ? 'Copied' : 'Copy Message'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Notes & Advance Pipeline →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly Calendar View Component
// ---------------------------------------------------------------------------
function WeeklyCalendarView({ meetings, onSelectMeeting }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [today] = useState(() => new Date());
  const currentDay = today.getDay(); // 0 is Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

  const weekDates = days.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      dayName,
      dateStr,
      displayDate: `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`
    };
  });

  return (
    <div className="calendar-week-grid card-panel">
      {weekDates.map((col) => {
        const dayMeetings = meetings.filter((m) => m.date === col.dateStr);
        return (
          <div key={col.dateStr} className="calendar-week-col">
            <div className="calendar-col-header">
              <span className="col-day-name">{col.dayName}</span>
              <span className="col-date-num font-mono">{col.displayDate}</span>
            </div>

            <div className="calendar-col-events">
              {dayMeetings.map((m) => (
                <div
                  key={m.id}
                  className={`calendar-chip chip-${(m.status || 'default').toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onSelectMeeting(m)}
                  title={`Click to view brief: ${m.title}`}
                >
                  <span className="chip-time font-mono">{m.time}</span>
                  <span className="chip-company font-medium">{m.company}</span>
                  <span className="chip-prospect">{m.prospectName}</span>
                </div>
              ))}

              {dayMeetings.length === 0 && (
                <div className="calendar-empty-slot">No meetings</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly Calendar View Component
// ---------------------------------------------------------------------------
function MonthlyCalendarView({ meetings, onSelectMeeting }) {
  const [today] = useState(() => new Date());
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // Blank padding
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    cells.push({ dayNum: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, dateStr: dStr });
  }

  return (
    <div className="calendar-month-container card-panel">
      <div className="month-title-header">
        <h3 className="month-heading font-editorial">{monthName} {year}</h3>
      </div>

      <div className="month-days-header">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d} className="month-day-col-title">{d}</span>
        ))}
      </div>

      <div className="month-grid">
        {cells.map((cell, idx) => {
          if (!cell.dayNum) {
            return <div key={`blank-${idx}`} className="month-cell cell-empty" />;
          }

          const dayMeetings = meetings.filter((m) => m.date === cell.dateStr);
          const isToday = cell.dateStr === today.toISOString().slice(0, 10);

          return (
            <div key={cell.dateStr} className={`month-cell ${isToday ? 'cell-today' : ''}`}>
              <span className="cell-day-num">{cell.dayNum}</span>
              <div className="cell-chips-wrap">
                {dayMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="month-event-chip"
                    onClick={() => onSelectMeeting(m)}
                    title={`${m.time} - ${m.company}`}
                  >
                    <span className="m-chip-time">{m.time}</span>
                    <span className="m-chip-name">{m.company}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Sync Boundary Modal
// ---------------------------------------------------------------------------
function CalendarSyncModal({ onClose }) {
  const { integrations, updateIntegration, showToast } = useOpportunities();
  const calConfig = integrations?.googleCalendar || {};

  const [connected, setConnected] = useState(calConfig.connected || false);
  const [email, setEmail] = useState(calConfig.email || 'sales@darkintent.in');

  const handleSave = () => {
    updateIntegration('googleCalendar', {
      connected,
      email,
      lastSynced: new Date().toISOString()
    });
    showToast(connected ? 'Google Calendar connected successfully.' : 'Calendar settings updated.', 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window sync-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">
            <IconCalendar size={18} />
          </div>
          <div>
            <h2 className="modal-title font-editorial">Google Calendar Synchronization</h2>
            <p className="modal-subtitle">Authorized OAuth 2.0 calendar integration boundary.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body-scroll">
          <div className="sync-status-card">
            <div className="sync-status-badge-row">
              <span className={`status-indicator-dot ${connected ? 'dot-active' : 'dot-waiting'}`} />
              <span className="sync-status-text font-medium">
                {connected ? 'Active Synchronization' : 'Awaiting Google OAuth Authorization'}
              </span>
            </div>
            <p className="sync-explanation">
              DarkIntent provides an autonomous internal scheduler that functions 100% offline. Connecting your Google Workspace account enables bidirectional sync with Google Meet and external invites.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="cal-email" className="form-label">Google Account Email</label>
            <input
              id="cal-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sales@yourdomain.com"
            />
          </div>

          <div className="form-field toggle-field">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={connected}
                onChange={(e) => setConnected(e.target.checked)}
              />
              <span className="toggle-text">Enable Google Calendar Event Creation & Auto-Meet Links</span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google Sheets & Export Boundary Modal
// ---------------------------------------------------------------------------
function GoogleSheetsSyncModal({ onClose, onExportCsv }) {
  const { integrations, updateIntegration, showToast } = useOpportunities();
  const sheetsConfig = integrations?.googleSheets || {};

  const [connected, setConnected] = useState(sheetsConfig.connected || false);
  const [sheetUrl, setSheetUrl] = useState(sheetsConfig.sheetUrl || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');

  const handleSave = () => {
    updateIntegration('googleSheets', {
      connected,
      sheetUrl,
      lastSynced: new Date().toISOString()
    });
    showToast(connected ? 'Google Sheets sync active.' : 'Settings updated.', 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-window sync-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">
            <IconSheet size={18} />
          </div>
          <div>
            <h2 className="modal-title font-editorial">Export & Google Sheets Sync</h2>
            <p className="modal-subtitle">One-click CSV downloads & live spreadsheet synchronization.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body-scroll">
          <div className="sync-status-card">
            <span className="sync-status-title font-medium">1. Instant Data Export (CSV)</span>
            <p className="sync-explanation">
              Export your full schedule, prospect contacts, meeting briefs, and notes directly to formatted CSV for external CRM imports.
            </p>
            <button
              type="button"
              className="btn btn-outline btn-sm btn-download-csv"
              onClick={() => {
                onExportCsv();
              }}
            >
              <IconDownload size={14} />
              <span>Download Meetings CSV Now</span>
            </button>
          </div>

          <div className="sync-status-card">
            <span className="sync-status-title font-medium">2. Live Google Sheets Integration</span>
            <div className="form-field">
              <label htmlFor="sheets-url" className="form-label">Google Sheet Target URL</label>
              <input
                id="sheets-url"
                type="url"
                className="form-input text-xs"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </div>
            <div className="form-field toggle-field">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={connected}
                  onChange={(e) => setConnected(e.target.checked)}
                />
                <span className="toggle-text">Synchronize meetings & pipeline changes to this sheet</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
