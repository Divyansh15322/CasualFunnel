/**
 * CausalFunnel Analytics Tracker v1.0
 * Drop this script onto any webpage to start tracking page_view and click events.
 *
 * Usage:
 *   <script src="tracker.js" data-endpoint="https://your-api/api/events"></script>
 */
(function (window, document) {
  'use strict';

  // ─── Configuration ──────────────────────────────────────────────────────────
  const currentScript = document.currentScript;
  const ENDPOINT =
    (currentScript && currentScript.getAttribute('data-endpoint')) ||
    'http://localhost:3001/api/events';

  const FLUSH_INTERVAL_MS = 2000;   // batch send every 2 s
  const MAX_QUEUE_SIZE    = 20;     // or immediately when queue hits this

  // ─── Session ID ─────────────────────────────────────────────────────────────
  function getOrCreateSessionId() {
    const KEY = 'cf_session_id';
    // Try localStorage first, fall back to cookie
    try {
      let id = localStorage.getItem(KEY);
      if (!id) {
        id = generateId();
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch (_) {
      // localStorage blocked — use cookie
      const match = document.cookie.match(/cf_session_id=([^;]+)/);
      if (match) return match[1];
      const id = generateId();
      document.cookie = `cf_session_id=${id}; path=/; max-age=86400`;
      return id;
    }
  }

  function generateId() {
    // Simple UUID v4-like
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const SESSION_ID = getOrCreateSessionId();

  // ─── Event Queue ────────────────────────────────────────────────────────────
  let queue = [];

  function enqueue(event) {
    queue.push(event);
    if (queue.length >= MAX_QUEUE_SIZE) flush();
  }

  function flush() {
    if (queue.length === 0) return;
    const batch = queue.slice();
    queue = [];

    // Use sendBeacon when available (survives page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        keepalive: true,
      }).catch(function () {});
    }
  }

  // Flush on interval and on page hide / unload
  setInterval(flush, FLUSH_INTERVAL_MS);
  window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);

  // ─── Base Event Builder ─────────────────────────────────────────────────────
  function buildEvent(type, extra) {
    return Object.assign({
      session_id: SESSION_ID,
      event_type: type,
      page_url:   window.location.href,
      timestamp:  new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer:   document.referrer || null,
    }, extra);
  }

  // ─── Page View ──────────────────────────────────────────────────────────────
  function trackPageView() {
    enqueue(buildEvent('page_view'));
  }

  // Track initial page view
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  // Handle SPA navigation (History API)
  (function () {
    const _push    = history.pushState.bind(history);
    const _replace = history.replaceState.bind(history);

    history.pushState = function () {
      _push.apply(history, arguments);
      trackPageView();
    };
    history.replaceState = function () {
      _replace.apply(history, arguments);
      trackPageView();
    };
    window.addEventListener('popstate', trackPageView);
  })();

  // ─── Click Tracking ─────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    enqueue(buildEvent('click', {
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
    }));
  }, { passive: true, capture: true });

  // ─── Public API ─────────────────────────────────────────────────────────────
  window.CausalFunnel = {
    sessionId: SESSION_ID,
    flush: flush,
    track: function (type, extra) {
      enqueue(buildEvent(type, extra));
    },
  };

})(window, document);
