# Free Deployment Guide: GitHub Pages & Mi Box 4K

You can host this entire dashboard **directly on GitHub using GitHub Pages for free**, with **zero third-party services** and **zero servers** to manage!

---

## Option 1: Deploy Directly on GitHub Pages (Recommended)

GitHub provides free web hosting for every repository via **GitHub Pages**. We have already configured a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys your dashboard whenever you push code.

### Step 1: Push this Repository to GitHub
1. Create a new repository on your GitHub account (e.g. named `HomeDashboard`).
2. Run these commands in your terminal:
   ```bash
   git add .
   git commit -m "feat: setup github pages deployment"
   git remote add origin https://github.com/<your-username>/HomeDashboard.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Enable GitHub Pages in Repository Settings
1. Open your repository on **GitHub.com**.
2. Click **Settings** (tab at the top) $\rightarrow$ select **Pages** (in the left sidebar).
3. Under **Build and deployment $\rightarrow$ Source**:
   - Change from *Deploy from a branch* to **GitHub Actions**.
4. That's it! GitHub will immediately trigger the action and deploy your dashboard.
5. In ~1 minute, your dashboard will be live at:
   ```
   https://<your-username>.github.io/HomeDashboard/
   ```

---

## Option 2: Deploy to Render (Alternative Web Service)

If you prefer Render:
1. Connect your GitHub repository at [dashboard.render.com](https://dashboard.render.com).
2. Choose **New Web Service**, set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
3. Render will deploy and give you a URL like `https://my-dashboard.onrender.com`.

---

## Part 2: Mi Box 4K & Vertical Monitor Setup (24x7 Kiosk)

Once you have your GitHub Pages URL (or Render URL), set up your Mi Box 4K:

### 1. Install Fully Kiosk Browser on Mi Box 4K
1. Download the **Fully Kiosk Browser (Android TV edition)** APK from [fully-kiosk.com](https://www.fully-kiosk.com).
2. Sideload it to your Mi Box using a flash drive or the free **Send Files to TV** app from the Google Play Store.

### 2. Configure Fully Kiosk for Vertical 1080x1920
In Fully Kiosk Settings:
1. **Web Content Settings $\rightarrow$ Start URL**:
   - Set to your GitHub Pages URL: `https://<your-username>.github.io/HomeDashboard/`
2. **Device Management $\rightarrow$ Screen Orientation**:
   - Set to **Force Portrait (90°)** or **Reverse Portrait (270°)**.  
     *(This rotates the output into portrait mode on your vertical screen!)*
3. **Device Management $\rightarrow$ Keep Screen On**:
   - Set to **ON** (prevents screen sleep).
4. **Other Settings $\rightarrow$ Run on Device Boot**:
   - Set to **ON** (auto-starts the dashboard whenever Mi Box boots or restarts).

### 3. Disable Android TV Sleep
1. On Mi Box: Go to **Settings $\rightarrow$ Device Preferences $\rightarrow$ Screen Saver** $\rightarrow$ Set to **Never**.
2. Go to **Settings $\rightarrow$ Device Preferences $\rightarrow$ About** $\rightarrow$ Click **Build Number** 7 times to unlock **Developer Options**.
3. In **Developer Options**, turn ON **Stay Awake**.

---

## How Google Calendar Works on GitHub Pages
- In the dashboard, click the **Settings (gear)** icon.
- Paste your **Secret address in iCal format** from Google Calendar.
- The dashboard automatically fetches and parses the calendar schedule using an integrated client-side parser with CORS fallback. No server is required!
