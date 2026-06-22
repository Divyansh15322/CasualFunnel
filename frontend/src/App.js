import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Sessions from './Sessions';
import Heatmap from './Heatmap';
import './App.css';

function StatCard({ label, value, icon, iconBg, valueColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="stat-value" style={{ color: valueColor }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('sessions');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await api.stats();
      setStats(s);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 15000);
    return () => clearInterval(t);
  }, [loadStats]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill="#2563EB"/>
            <circle cx="8"  cy="18" r="2.8" fill="white"/>
            <circle cx="13" cy="11" r="2.8" fill="white" opacity=".75"/>
            <circle cx="19" cy="6"  r="2.8" fill="white" opacity=".45"/>
            <line x1="8" y1="18" x2="13" y2="11" stroke="white" strokeWidth="1.4" opacity=".5"/>
            <line x1="13" y1="11" x2="19" y2="6" stroke="white" strokeWidth="1.4" opacity=".3"/>
          </svg>
          <span style={{ color: 'var(--text)' }}>CausalFunnel</span>
        </div>

        <div className="sidebar-section-label">Analytics</div>
        <nav className="sidebar-nav">
          <button
            className={"nav-item" + (tab === 'sessions' ? ' active' : '')}
            onClick={() => setTab('sessions')}
          >
            <GridIcon active={tab === 'sessions'} />
            Sessions
          </button>
          <button
            className={"nav-item" + (tab === 'heatmap' ? ' active' : '')}
            onClick={() => setTab('heatmap')}
          >
            <HeatIcon active={tab === 'heatmap'} />
            Heatmap
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="live-indicator">
            <span className="live-dot" />
            <span>Live tracking active</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-breadcrumb">Dashboard</div>
            <h1 className="page-title">
              {tab === 'sessions' ? 'Sessions' : 'Click Heatmap'}
            </h1>
          </div>
          <div className="topbar-right">
            {error && (
              <span className="error-pill">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1L11 10H1L6 1z" fillOpacity=".15" stroke="currentColor" strokeWidth="1"/>
                  <text x="6" y="9" textAnchor="middle" fontSize="6" fontWeight="700">!</text>
                </svg>
                API unreachable
              </span>
            )}
            <button className="refresh-btn" onClick={loadStats} title="Refresh stats">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 7A5 5 0 1 1 7 2"/>
                <polyline points="7 0 9.5 2.5 7 5"/>
              </svg>
            </button>
          </div>
        </header>

        {stats && (
          <div className="stats-row">
            <StatCard label="Sessions"   value={stats.sessions?.toLocaleString()}    icon="👥" iconBg="#EEF4FF" valueColor="#2563EB" />
            <StatCard label="Events"     value={stats.total_events?.toLocaleString()} icon="⚡" iconBg="#F5F3FF" valueColor="#7C3AED" />
            <StatCard label="Page Views" value={stats.page_views?.toLocaleString()}  icon="👁" iconBg="#ECFDF5" valueColor="#059669" />
            <StatCard label="Clicks"     value={stats.clicks?.toLocaleString()}      icon="🖱" iconBg="#FFFBEB" valueColor="#D97706" />
          </div>
        )}

        <div className="content">
          {tab === 'sessions' ? <Sessions /> : <Heatmap />}
        </div>
      </div>
    </div>
  );
}

function GridIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={active ? '#2563EB' : 'currentColor'}>
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  );
}

function HeatIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke={active ? '#2563EB' : 'currentColor'} strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" fill={active ? '#2563EB' : 'currentColor'}/>
      <circle cx="8" cy="8" r="5"/>
      <circle cx="8" cy="8" r="7.5" strokeOpacity=".3"/>
    </svg>
  );
}
