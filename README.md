CausalFunnel Analytics

A full-stack user analytics platform that tracks page views and clicks, stores events in MongoDB, and visualizes user behavior through an interactive React dashboard with session analytics and click heatmaps.

🌐 Live Demo

- Frontend Dashboard: https://casual-funnel-liart.vercel.app/
- Backend API: https://casualfunnel-backend.onrender.com
- Repository: https://github.com/Divyansh15322/CasualFunnel

«Reviewer Note: The dashboard includes pre-generated analytics data for evaluation. You can explore existing sessions and analytics immediately after opening the application.»

✨ Features

- 📊 Real-time analytics dashboard
- 👤 Session tracking with persistent session IDs
- 🖱️ Click tracking and page view monitoring
- 🔥 Interactive click heatmap visualization
- 📈 Session explorer with event journey timeline
- ⚡ Lightweight dependency-free JavaScript tracker
- 💾 MongoDB-backed event storage
- 🚀 Fully deployed using Vercel and Render

🛠️ Tech Stack

Layer| Technology
Frontend| React
Backend| Node.js + Express
Database| MongoDB Atlas
Tracker| Vanilla JavaScript
Deployment| Vercel + Render

📡 REST API

- "POST /api/events"
- "GET /api/sessions"
- "GET /api/sessions/:sessionId"
- "GET /api/heatmap?page_url=<url>"
- "GET /api/pages"
- "GET /api/stats"
- "GET /health"

📁 Project Structure

backend/
frontend/
tracker/
demo/

📋 Key Capabilities

- Automatic page view tracking
- Click coordinate collection
- Session-based analytics
- Event batching for performance
- Interactive heatmap rendering
- Responsive analytics dashboard

🔮 Future Enhancements

- Authentication & authorization
- Multi-tenant support
- Real-time dashboard updates
- Custom event definitions
- Exportable reports
- Normalized heatmaps across screen sizes

📝 Notes

- Events are batched before being sent to reduce network overhead.
- Session IDs persist across visits using browser storage.
- The deployed dashboard contains sample analytics data to simplify evaluation.