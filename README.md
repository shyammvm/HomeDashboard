# Aether — 24x7 Ambient Smart Home Dashboard

A bespoke, ultra-fast ambient smart dashboard engineered for **vertical (1080x1920) displays**, smart mirrors, and wall-mounted screens powered by Android TV boxes (like the **Mi Box 4K**), Raspberry Pis, or mini PCs.

![Aether Ambient Dashboard](public/favicon.svg)

---

## 🌟 Key Features

- 🖥️ **Vertical 1080x1920 Native Layout**: Tailored specifically for portrait monitors with deep OLED pitch-black background (`#05070c`) and subtle ambient glows.
- 🕒 **Ambient Digital Clock**: Huge high-legibility clock face with pulsing seconds, day of week, full date, and dynamic time-of-day greeting (*"Good afternoon, Shyam"*).
- ⛅ **Live Weather & 4-Day Forecast**: Integrated with **Open-Meteo** (no API key required). Shows current temp, feels-like, humidity, wind speed, weather conditions, and 4-day mini forecast.
- 📅 **Google Calendar Schedule**: Connects to any Google Calendar / Apple Calendar private iCal (`.ics`) feed. Shows upcoming events, meeting links, and a *"Next Up"* countdown badge (*"In 45m: Team Standup"*).
- ✅ **Daily Tasks & Google Tasks**: Interactive to-do checklist with progress bar, completion tags, priority indicators (High, Med, Normal), and quick inline task adding.
- 💰 **Personal Expense Tracker**:
  - Live daily spend tally and monthly budget progress bar with warning indicators.
  - Quick-add expense drawer (Amount, Category, Description).
  - Category breakdown with visual color meters (Food, Groceries, Utilities, Transit, Shopping).
  - Transaction history log.
- 📰 **Live RSS News & Headlines**: Auto-cycling news ticker with real-time countdown progress bar (BBC World News, TechCrunch, or your custom RSS feed).
- 💭 **Daily Philosophical Quote**: Rotating inspiring thoughts from Marcus Aurelius, Steve Jobs, Seneca, Leonardo da Vinci, and more.
- 🔄 **Display Orientation Overrides**: Built-in 0°, 90°, 180°, and 270° CSS rotation controls to solve Android TV landscape locks.
- 🚀 **Free Cloud Deployment**: Ready for 1-click deployment on **Render** (via included `render.yaml` and Express production server) or **Vercel**.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ☁️ Deploying to Render (Free Web Service)

This repository includes a production `server.js` with built-in CORS proxying for Google Calendar and RSS feeds, and a `render.yaml` blueprint.

1. Push this repository to **GitHub**.
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Render will deploy your dashboard and provide a public URL (e.g. `https://my-dashboard.onrender.com`).

For detailed instructions on setting up your **Mi Box 4K** (sideloading Fully Kiosk Browser, forcing portrait mode, disabling sleep), read [DEPLOYMENT.md](file:///Users/shyammvm/HomeDashboard/DEPLOYMENT.md).

---

## ⚙️ Settings & Customization

Click the **Settings (gear)** icon on the top right of the dashboard:
- **Google Calendar URL**: Paste your private iCal link from Google Calendar.
- **Weather Location**: Change your city name (e.g. `Chennai`, `Bangalore`, `New York`, `London`).
- **Currency & Budget**: Choose currency (`₹`, `$`, `€`, `£`) and monthly budget limit.
- **News RSS Feed**: Enter your favorite RSS news feed.
- **Screen Rotation**: Force 90° or 270° rotation if your Android TV output is landscape.
