import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api';

const CANVAS_W = 1280;
const CANVAS_H = 800;

function drawDot(ctx, x, y, radius, alpha) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0,   `rgba(239,68,68,${alpha})`);
  grad.addColorStop(0.4, `rgba(245,158,11,${alpha * 0.65})`);
  grad.addColorStop(1,   `rgba(96,165,250,0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function renderHeatmap(canvas, clicks) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Light background to match the cream theme
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  if (clicks.length === 0) return;

  const maxNeighbors = Math.max(...clicks.map(c =>
    clicks.filter(d => Math.hypot(c.x - d.x, c.y - d.y) < 60).length
  ));

  ctx.globalCompositeOperation = 'multiply';
  clicks.forEach(({ x, y }) => {
    const nearby = clicks.filter(d => Math.hypot(x - d.x, y - d.y) < 60).length;
    const density = maxNeighbors > 0 ? nearby / maxNeighbors : 0.5;
    drawDot(ctx, x, y, 30 + density * 45, 0.12 + density * 0.5);
  });
  ctx.globalCompositeOperation = 'source-over';

  // Individual click dots
  clicks.forEach(({ x, y }) => {
    ctx.fillStyle = 'rgba(37,99,235,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

export default function Heatmap() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.pages().then(p => { setPages(p); if (p.length > 0) setSelectedPage(p[0]); }).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    if (!selectedPage) return;
    setLoading(true); setLoaded(false);
    try {
      const data = await api.heatmap(selectedPage);
      setClicks(data.clicks || []);
      setLoaded(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedPage]);

  useEffect(() => { if (loaded) renderHeatmap(canvasRef.current, clicks); }, [clicks, loaded]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = '#F7F5F0';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }, [selectedPage]);

  return (
    <div>
      <div className="heatmap-controls">
        {pages.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '8px 0' }}>
            No pages tracked yet — open the demo page and click around first.
          </div>
        ) : (
          <>
            <select
              className="heatmap-select"
              value={selectedPage}
              onChange={e => { setSelectedPage(e.target.value); setLoaded(false); }}
            >
              {pages.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="heatmap-btn" onClick={load} disabled={loading || !selectedPage}>
              {loading ? 'Loading…' : 'Load Heatmap'}
            </button>
            {loaded && (
              <span className="heatmap-info">
                {clicks.length} click{clicks.length !== 1 ? 's' : ''} recorded
              </span>
            )}
          </>
        )}
      </div>

      <div className="heatmap-canvas-wrap">
        <div className="heatmap-canvas-header">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="4" fill="rgba(37,99,235,.15)"/>
            <circle cx="7" cy="7" r="2" fill="#2563EB"/>
            <circle cx="7" cy="7" r="6" stroke="rgba(37,99,235,.2)" strokeWidth="1" fill="none"/>
          </svg>
          {loaded ? `${selectedPage}` : 'Select a page URL and click "Load Heatmap"'}
        </div>

        {!loaded && !loading && (
          <div style={{
            height: 380, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
            gap: 16, background: '#F7F5F0',
          }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="12" fill="rgba(37,99,235,.08)"/>
              <circle cx="28" cy="28" r="20" stroke="rgba(37,99,235,.1)" strokeWidth="1.5" fill="none"/>
              <circle cx="28" cy="28" r="27" stroke="rgba(37,99,235,.05)" strokeWidth="1" fill="none"/>
              <circle cx="28" cy="28" r="5" fill="#2563EB" opacity=".4"/>
            </svg>
            <div style={{ fontSize: '.88rem', color: 'var(--muted)', fontWeight: 500 }}>
              Click heatmap will appear here
            </div>
            <div style={{ fontSize: '.76rem', color: 'var(--muted2)' }}>
              Warmer colours = higher click density
            </div>
          </div>
        )}

        {loading && (
          <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
            <div className="spinner" />
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_W} height={CANVAS_H}
          className="heatmap-canvas"
          style={{ display: loaded ? 'block' : 'none' }}
        />

        {loaded && (
          <div className="heatmap-legend">
            <span>Low density</span>
            <div className="legend-gradient" />
            <span>High density</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: '#2563EB', borderRadius: '50%', display: 'inline-block' }}></span>
              Blue dots = individual clicks
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
