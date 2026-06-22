import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Sessions from './Sessions';
import Heatmap from './Heatmap';
import './App.css';

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
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
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#5b6ef5"/>
            <circle cx="9" cy="19" r="3" fill="white"/>
            <circle cx="14" cy="12" r="3" fill="white" opacity=".7"/>
            <circle cx="20" cy="7" r="3" fill="white" opacity=".4"/>
            <line x1="9" y1="19" x2="14" y2="12" stroke="white" strokeWidth="1.5" opacity=".5"/>
            <line x1="14" y1="12" x2="20" y2="7" stroke="white" strokeWidth="1.5" opacity=".3"/>
          </svg>
          <span>CausalFunnel</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={"nav-item" + (tab === 'sessions' ? ' active' : '')}
            onClick={() => setTab('sessions')}
          >
            <GridIcon /> Sessions
          </button>
          <button
            className={"nav-item" + (tab === 'heatmap' ? ' active' : '')}
            onClick={() => setTab('heatmap')}
          >
            <HeatIcon /> Heatmap
          </button>
        </nav>

        <div className="sidebar-footer">
          <span className="live-dot" />
          Live tracking
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">
              {tab === 'sessions' ? 'Sessions' : 'Click Heatmap'}
            </h1>
            {error && <span className="error-pill">⚠ Cannot reach API</span>}
          </div>
          <button className="refresh-btn" onClick={loadStats} title="Refresh">↺</button>
        </header>

        {stats && (
          <div className="stats-row">
            <StatCard label="Sessions"    value={stats.sessions?.toLocaleString()}     color="#5b6ef5" />
            <StatCard label="Events"      value={stats.total_events?.toLocaleString()}  color="#e8eaf0" />
            <StatCard label="Page Views"  value={stats.page_views?.toLocaleString()}    color="#38e5a8" />
            <StatCard label="Clicks"      value={stats.clicks?.toLocaleString()}        color="#f5a623" />
          </div>
        )}

        <div className="content">
          {tab === 'sessions' ? <Sessions /> : <Heatmap />}
        </div>
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  );
}

function HeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
      <circle cx="8" cy="8" r="5"/>
      <circle cx="8" cy="8" r="7.5" strokeOpacity=".3"/>
    </svg>
  );
}
