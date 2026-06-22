import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api';

const CANVAS_W = 1280;
const CANVAS_H = 800;

// Draw a radial gradient "hotspot" on canvas 2d context
function drawDot(ctx, x, y, radius, alpha) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, `rgba(255, 80, 80, ${alpha})`);
  grad.addColorStop(0.4, `rgba(255, 160, 30, ${alpha * 0.6})`);
  grad.addColorStop(1, `rgba(56, 229, 168, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function renderHeatmap(canvas, clicks) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw a subtle page-like background
  ctx.fillStyle = '#161922';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  if (clicks.length === 0) return;

  // Build density map for adaptive radius/alpha
  const maxNeighbors = Math.max(...clicks.map((c, i) => {
    return clicks.filter((d, j) => j !== i && Math.hypot(c.x - d.x, c.y - d.y) < 60).length;
  }));

  // Blend mode for natural hotspot layering
  ctx.globalCompositeOperation = 'screen';

  clicks.forEach(({ x, y }) => {
    const nearby = clicks.filter(d => Math.hypot(x - d.x, y - d.y) < 60).length;
    const density = maxNeighbors > 0 ? nearby / maxNeighbors : 0.5;
    const radius = 30 + density * 40;
    const alpha  = 0.15 + density * 0.45;
    drawDot(ctx, x, y, radius, alpha);
  });

  ctx.globalCompositeOperation = 'source-over';

  // Draw individual click dots on top
  clicks.forEach(({ x, y }) => {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
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
    api.pages().then(p => {
      setPages(p);
      if (p.length > 0) setSelectedPage(p[0]);
    }).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    if (!selectedPage) return;
    setLoading(true);
    setLoaded(false);
    try {
      const data = await api.heatmap(selectedPage);
      setClicks(data.clicks || []);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedPage]);

  // Render whenever clicks change
  useEffect(() => {
    if (loaded) renderHeatmap(canvasRef.current, clicks);
  }, [clicks, loaded]);

  // Initial render on empty canvas when a page is first selected
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#161922';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }, [selectedPage]);

  return (
    <div>
      <div className="heatmap-controls">
        {pages.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
            No pages tracked yet — visit a page with the tracker script.
          </div>
        ) : (
          <>
            <select
              className="heatmap-select"
              value={selectedPage}
              onChange={e => { setSelectedPage(e.target.value); setLoaded(false); }}
            >
              {pages.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button className="heatmap-btn" onClick={load} disabled={loading || !selectedPage}>
              {loading ? 'Loading…' : 'Load Heatmap'}
            </button>
            {loaded && (
              <span className="heatmap-info">
                {clicks.length} click{clicks.length !== 1 ? 's' : ''} on this page
              </span>
            )}
          </>
        )}
      </div>

      <div className="heatmap-canvas-wrap">
        <div className="heatmap-canvas-header">
          {loaded
            ? `Heatmap · ${selectedPage}`
            : 'Select a page and click "Load Heatmap"'}
        </div>

        {!loaded && !loading && (
          <div style={{
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: 'var(--muted)',
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="10" fill="rgba(91,110,245,.2)"/>
              <circle cx="24" cy="24" r="18" stroke="rgba(91,110,245,.15)" strokeWidth="2"/>
              <circle cx="24" cy="24" r="23" stroke="rgba(91,110,245,.07)" strokeWidth="2"/>
              <circle cx="24" cy="24" r="4" fill="#5b6ef5"/>
            </svg>
            <div style={{ fontSize: '.85rem' }}>Click heatmap will appear here</div>
          </div>
        )}

        {loading && (
          <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="heatmap-canvas"
          style={{ display: loaded ? 'block' : 'none' }}
        />

        {loaded && (
          <div className="heatmap-legend">
            <span>Low density</span>
            <div className="legend-gradient" />
            <span>High density</span>
            <span style={{ marginLeft: 'auto' }}>
              · White dots = individual clicks
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
