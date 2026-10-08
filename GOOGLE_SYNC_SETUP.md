# 🔄 Google Calendar & Google Tasks 24×7 Sync Setup

This setup uses a lightweight, free Google Apps Script running directly in your Google account. It automatically streams **both your Google Calendar and Google Tasks** to your wall dashboard without requiring periodic browser logins, cookie renewals, or OAuth tokens on your Mi Box 4K / TV.

---

## ⏱️ 2-Minute Quick Setup

### Step 1: Open Google Apps Script
1. Go to **[script.google.com](https://script.google.com/)** and log in with your Google account.
2. Click **"+ New Project"** (top left).
3. Name the project **"Aether Dashboard Sync"** (click "Untitled project" at the top to rename).

---

### Step 2: Enable Google Tasks Service
1. On the left sidebar of the script editor, click the **`+` icon next to "Services"**.
2. In the list, select **"Tasks API"** (Google Tasks API).
3. Click **"Add"**.

---

### Step 3: Paste the Sync Script
1. Delete any existing code inside `Code.gs`.
2. Copy the entire contents of [`google-sync-script.js`](file:///Users/shyammvm/HomeDashboard/google-sync-script.js) from this repository and paste it into `Code.gs`.
3. Press **Cmd + S** (or **Ctrl + S**) to save.
4. *(Optional verification)*: Select **`testSync`** from the function dropdown at the top of the editor and click **Run**. Check the Execution log to see your calendar events and Google Tasks retrieved!

---

### Step 4: Deploy as a Web App
1. Click the blue **"Deploy"** button in the top right corner $\rightarrow$ select **"New deployment"**.
2. Click the gear icon (**⚙️**) next to "Select type" $\rightarrow$ choose **"Web app"**.
3. Configure:
   - **Description**: `Aether 24x7 Sync`
   - **Execute as**: `Me (your Google email)`
   - **Who has access**: `Anyone` *(Note: This ensures your local dashboard and TV screen can read the JSON stream without session timeouts)*
4. Click **"Deploy"**.
5. Google will ask you to **"Authorize access"** $\rightarrow$ choose your Google account $\rightarrow$ click *Advanced* $\rightarrow$ *Go to Aether Dashboard Sync (unsafe)* $\rightarrow$ click *Allow*.
6. Copy the **Web App URL** provided (it looks like `https://script.google.com/macros/s/.../exec`).

---

### Step 5: Paste your URL into `src/config.js`
Open [`src/config.js`](file:///Users/shyammvm/HomeDashboard/src/config.js) in your codebase and paste your URL into `googleSyncUrl`:

```javascript
export const DASHBOARD_CONFIG = {
  userName: 'Shyam',
  city: 'Chennai',
  currency: '₹',
  monthlyBudget: 40000,
  rssUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  rotation: 0,

  // Paste your published Google Web App URL here:
  googleSyncUrl: 'https://script.google.com/macros/s/AKfycbx.../exec',
};
```

---

## ✨ What Happens Now
- **Google Calendar**: Your primary calendar events for the next 14 days stream automatically with the glowing **"GOOGLE SYNC"** badge and live meeting countdowns.
- **Google Tasks**: All your tasks (across all task lists) appear directly in the **"Daily Tasks & Focus"** card with the **"GOOGLE TASKS"** badge, due dates, priority markers, and completion status.
- **24×7 Auto-Refresh**: Calendar refreshes every 10 minutes, and Google Tasks refreshes every 5 minutes automatically.
- **Centralized Settings Sync**: All dashboard preferences (greeting, commute origins, office tech parks, LCD TV night sleep timers, RSS feeds, rotation) are synced between your Phone, Laptop, and TV.
- **📱 Remote Editing on Phone/Laptop**: On your TV, click **REMOTE** to scan the QR code with your phone camera, or open `https://<your-dashboard-url>/?remote=1` on your laptop. Any changes saved there broadcast to the TV within seconds!

