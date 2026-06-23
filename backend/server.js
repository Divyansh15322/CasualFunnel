require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://casual-funnel-liart.vercel.app/',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/causalfunnel';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Schema ───────────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  session_id:  { type: String, required: true, index: true },
  event_type:  { type: String, required: true, enum: ['page_view', 'click'] },
  page_url:    { type: String, required: true },
  timestamp:   { type: Date,   required: true },
  x:           { type: Number }, // click coordinates
  y:           { type: Number },
  user_agent:  { type: String },
  referrer:    { type: String },
}, { timestamps: true });

eventSchema.index({ page_url: 1, event_type: 1 });
eventSchema.index({ session_id: 1, timestamp: 1 });

const Event = mongoose.model('Event', eventSchema);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/events — receive and store events
app.post('/api/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    const docs = events.map(e => ({
      session_id: e.session_id,
      event_type: e.event_type,
      page_url:   e.page_url,
      timestamp:  new Date(e.timestamp),
      x:          e.x ?? null,
      y:          e.y ?? null,
      user_agent: e.user_agent ?? null,
      referrer:   e.referrer ?? null,
    }));

    await Event.insertMany(docs);
    res.status(201).json({ ok: true, stored: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions — list sessions with event counts
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views:   { $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] } },
          clicks:       { $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] } },
          first_seen:   { $min: '$timestamp' },
          last_seen:    { $max: '$timestamp' },
          pages:        { $addToSet: '$page_url' },
        },
      },
      { $sort: { last_seen: -1 } },
      {
        $project: {
          session_id:   '$_id',
          total_events: 1,
          page_views:   1,
          clicks:       1,
          first_seen:   1,
          last_seen:    1,
          page_count:   { $size: '$pages' },
          duration_sec: {
            $round: [{
              $divide: [
                { $subtract: ['$last_seen', '$first_seen'] },
                1000,
              ]
            }, 0]
          },
        },
      },
    ]);

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:sessionId — ordered event list for a session
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const events = await Event.find({ session_id: req.params.sessionId })
      .sort({ timestamp: 1 })
      .lean();

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/heatmap?page_url=... — click data for a page
app.get('/api/heatmap', async (req, res) => {
  try {
    const { page_url } = req.query;
    if (!page_url) {
      return res.status(400).json({ error: 'page_url query param required' });
    }

    const clicks = await Event.find({
      event_type: 'click',
      page_url,
      x: { $ne: null },
      y: { $ne: null },
    })
      .select('x y timestamp session_id -_id')
      .lean();

    res.json({ page_url, total: clicks.length, clicks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pages — distinct tracked page URLs
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Event.distinct('page_url');
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — quick summary stats
app.get('/api/stats', async (req, res) => {
  try {
    const [totals, sessionCount] = await Promise.all([
      Event.aggregate([
        {
          $group: {
            _id: null,
            total_events: { $sum: 1 },
            page_views:   { $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] } },
            clicks:       { $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] } },
          },
        },
      ]),
      Event.distinct('session_id').then(s => s.length),
    ]);

    const t = totals[0] ?? { total_events: 0, page_views: 0, clicks: 0 };
    res.json({ ...t, sessions: sessionCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// Keep-alive for Render free tier
if (process.env.RENDER) {
  const SELF = process.env.RENDER_EXTERNAL_URL;
  setInterval(() => {
    fetch(`${SELF}/health`).catch(() => {});
  }, 10 * 60 * 1000); // ping every 10 minutes
}