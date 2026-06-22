import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(sec) {
  if (!sec || sec < 1) return '< 1s';
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function initials(sid) {
  return sid ? sid.slice(0, 2).toUpperCase() : '??';
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try { setSessions(await api.sessions()); }
    catch (e) { console.error(e); }
    finally { setLoadingSessions(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const selectSession = useCallback(async (sid) => {
    setSelected(sid);
    setLoadingEvents(true);
    setEvents([]);
    try { setEvents(await api.session(sid)); }
    catch (e) { console.error(e); }
    finally { setLoadingEvents(false); }
  }, []);

  return (
    <div className="sessions-layout">
      {/* Left panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Sessions</span>
          {sessions.length > 0 && <span className="panel-count">{sessions.length} total</span>}
        </div>
        <div className="panel-body">
          {loadingSessions ? (
            <div className="loading"><div className="spinner" /></div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No sessions yet</div>
              <div className="empty-text">Open the demo page and click around to generate data</div>
            </div>
          ) : sessions.map(s => (
            <div
              key={s.session_id}
              className={"session-row" + (selected === s.session_id ? ' selected' : '')}
              onClick={() => selectSession(s.session_id)}
            >
              <div className="session-avatar">{initials(s.session_id)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="session-id" title={s.session_id}>{s.session_id}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {s.page_views > 0 && <span className="badge badge-views">👁 {s.page_views}</span>}
                  {s.clicks > 0 && <span className="badge badge-clicks">🖱 {s.clicks}</span>}
                  <span className="session-time">{formatTime(s.last_seen)}</span>
                  {s.duration_sec > 0 && <span className="session-time">· {formatDuration(s.duration_sec)}</span>}
                </div>
              </div>
              <span className="badge badge-events">{s.total_events}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            {selected ? 'User Journey' : 'Event Timeline'}
          </span>
          {events.length > 0 && <span className="panel-count">{events.length} events</span>}
        </div>
        <div className="panel-body">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon">↖</div>
              <div className="empty-title">Select a session</div>
              <div className="empty-text">Click any session on the left to explore its event timeline</div>
            </div>
          ) : loadingEvents ? (
            <div className="loading"><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No events found</div>
            </div>
          ) : (
            <div className="timeline">
              {events.map((ev, i) => (
                <div key={ev._id || i} className="event-item">
                  <div className={"event-icon " + (ev.event_type === 'page_view' ? 'icon-view' : 'icon-click')}>
                    {ev.event_type === 'page_view' ? '👁' : '🖱'}
                  </div>
                  <div className="event-body">
                    <div className="event-type">
                      {ev.event_type === 'page_view' ? 'Page View' : 'Click'}
                    </div>
                    <div className="event-url" title={ev.page_url}>{ev.page_url}</div>
                    {ev.event_type === 'click' && ev.x != null && (
                      <div className="event-coords">x: {ev.x}  y: {ev.y}</div>
                    )}
                  </div>
                  <div className="event-time">
                    {new Date(ev.timestamp).toLocaleTimeString(undefined, {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
