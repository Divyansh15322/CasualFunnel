import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(sec) {
  if (!sec || sec < 1) return '< 1s';
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await api.sessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const selectSession = useCallback(async (sid) => {
    setSelected(sid);
    setLoadingEvents(true);
    setEvents([]);
    try {
      const data = await api.session(sid);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  return (
    <div className="sessions-layout">
      {/* Left: session list */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Sessions</span>
          <span className="panel-count">{sessions.length}</span>
        </div>
        <div className="panel-body">
          {loadingSessions ? (
            <div className="loading"><div className="spinner" /></div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No sessions yet</div>
              <div className="empty-text" style={{ fontSize: '.73rem', marginTop: 4 }}>
                Add tracker.js to a page and visit it
              </div>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.session_id}
                className={"session-row" + (selected === s.session_id ? ' selected' : '')}
                onClick={() => selectSession(s.session_id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="session-id">{s.session_id}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 2 }}>
                    {formatTime(s.last_seen)} · {formatDuration(s.duration_sec)}
                    {s.page_count > 1 ? ` · ${s.page_count} pages` : ''}
                  </div>
                </div>
                <div className="session-meta">
                  <span className="badge badge-events">{s.total_events} events</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {s.page_views > 0 && (
                      <span style={{ fontSize: '.7rem', color: 'var(--accent2)' }}>
                        👁 {s.page_views}
                      </span>
                    )}
                    {s.clicks > 0 && (
                      <span style={{ fontSize: '.7rem', color: '#f5a623' }}>
                        🖱 {s.clicks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: event journey */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            {selected ? 'User Journey' : 'Select a session'}
          </span>
          {events.length > 0 && <span className="panel-count">{events.length} events</span>}
        </div>
        <div className="panel-body">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon">←</div>
              <div className="empty-text">Click a session to view its events</div>
            </div>
          ) : loadingEvents ? (
            <div className="loading"><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">No events found</div>
            </div>
          ) : (
            events.map((ev, i) => (
              <div key={ev._id || i} className="event-item">
                <div className={"event-icon " + (ev.event_type === 'page_view' ? 'icon-view' : 'icon-click')}>
                  {ev.event_type === 'page_view' ? '👁' : '🖱'}
                </div>
                <div className="event-body">
                  <div className="event-type">
                    {ev.event_type === 'page_view' ? 'Page View' : 'Click'}
                  </div>
                  <div className="event-url" title={ev.page_url}>
                    {ev.page_url}
                  </div>
                  {ev.event_type === 'click' && ev.x != null && (
                    <div className="event-coords">
                      x:{ev.x} y:{ev.y}
                    </div>
                  )}
                </div>
                <div className="event-time">
                  {new Date(ev.timestamp).toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
