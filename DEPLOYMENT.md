# Deployment & Mi Box 4K 24x7 Setup Guide

This guide walks you through deploying your **Aether Ambient Dashboard** to **Render** (100% free tier) and setting up your **Mi Box 4K** on your vertical 1080x1920 monitor.

---

## Part 1: Deploy to Render (Free Web Service)

[Render](https://render.com) offers a free cloud web service tier that will host your dashboard 24/7 with zero monthly cost.

### Step 1: Push This Repository to GitHub
1. Initialize a git repository if you haven't already:
   ```bash
   git add .
   git commit -m "feat: ambient 1080x1920 home dashboard"
   ```
2. Create a new repository on your GitHub account (e.g. `home-dashboard`).
3. Push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/home-dashboard.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `home-dashboard` repository.
4. Fill in the deployment settings:
   - **Name**: `my-home-dashboard` (or any name you like)
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.

> **Note**: Render will automatically detect `render.yaml` or you can manually configure as above. In 1–2 minutes, Render will provide a live URL like:  
> `https://my-home-dashboard.onrender.com`

---

## Part 2: Mi Box 4K & Vertical Monitor Setup (24x7 Kiosk)

Android TV is designed primarily for horizontal (16:9) TVs. To make it run seamlessly on a **vertical (1080x1920)** monitor 24/7 without turning off:

### 1. Install Fully Kiosk Browser on Mi Box 4K
**Fully Kiosk Browser** is the gold standard for smart mirrors and digital signage displays:
1. On your phone or computer, download the **Fully Kiosk Browser (Android TV / Fire OS edition)** APK from [fully-kiosk.com](https://www.fully-kiosk.com/en/#download-box).
2. Install the **Send Files to TV** app from the Google Play Store on your Mi Box and on your phone.
3. Send the Fully Kiosk APK to your Mi Box, then install it using a file manager (e.g., *File Commander* or *X-plore*).

### 2. Configure Fully Kiosk Browser for Vertical 1080x1920
In Fully Kiosk Browser settings:
1. **Web Content Settings $\rightarrow$ Start URL**:
   - Set to your Render URL: `https://my-home-dashboard.onrender.com` (or your local IP `http://192.168.1.19:5173` if running locally).
2. **Device Management $\rightarrow$ Screen Orientation**:
   - Set to **Force Portrait (90°)** or **Reverse Portrait (270°)** depending on your monitor mount direction.
   - *This eliminates the Android TV sideways-display problem instantly!*
3. **Device Management $\rightarrow$ Keep Screen On**:
   - Turn **ON** (Prevents the screen from sleeping or dimming).
4. **Other Settings $\rightarrow$ Run on Device Boot**:
   - Turn **ON** (The dashboard auto-opens whenever the Mi Box powers on or restarts).
5. **Kiosk Mode (Optional)**:
   - Locks the app in fullscreen and disables navigation bars and address bars.

### 3. Disable Android TV Sleep & Screensaver
1. On the Mi Box: Go to **Settings $\rightarrow$ Device Preferences $\rightarrow$ Screen Saver** $\rightarrow$ Set to **Turn screen off: Never**.
2. Go to **Settings $\rightarrow$ Device Preferences $\rightarrow$ About** $\rightarrow$ Click **Build Number** 7 times to enable **Developer Options**.
3. In **Developer Options**, toggle **Stay Awake** (Screen will never sleep while connected to power).

---

## Part 3: Connecting Your Integrations

### 1. Google Calendar
1. Open Google Calendar in your web browser: [calendar.google.com](https://calendar.google.com).
2. On the left sidebar under *My calendars*, hover over your calendar $\rightarrow$ click the 3 vertical dots $\rightarrow$ **Settings and sharing**.
3. Scroll down to the **Integrate calendar** section.
4. Locate the **Secret address in iCal format** box and copy the `.ics` link.
   *(Example: `https://calendar.google.com/calendar/ical/.../basic.ics`)*
5. On your dashboard, click the **Settings (gear)** icon $\rightarrow$ paste into **Google Calendar iCal URL** $\rightarrow$ click **Save Preferences**.

### 2. Open-Meteo Weather
- Requires **no API key**.
- In the dashboard Settings, type your city name (e.g. `Chennai`, `Bangalore`, `New York`, `London`) and it will automatically geocode and fetch hourly and 4-day forecasts.

### 3. Personal Expense Tracker
- Directly interactive on the dashboard.
- Set your monthly budget limit and currency (`₹`, `$`, `€`, `£`) in Settings.
- Quick add expenses using the inline form. All transactions are preserved locally.

### 4. Screen Rotation Fallback
If you are using a standard browser on Android TV that does not force portrait mode, you can simply click the **Rotation (rotate icon)** in the top bar of the dashboard. It will rotate the viewport 90°/180°/270° via hardware-accelerated CSS transforms!
