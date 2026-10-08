// Aether Dashboard — Centralized Personal Configuration
// This file controls default configurations for your 24x7 smart display.

export const DASHBOARD_CONFIG = {
  userName: 'Shyam',
  city: 'Your Location',
  homeAddress: 'Whitefield, Bangalore',
  officeAddress: 'EcoWorld, Bellandur',
  officeName: 'Work / EcoWorld',
  currency: '₹',
  rssUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  newsCycleSeconds: 35, // Display stay duration per news story (in seconds)
  rotation: 0,

  // LCD TV Care & Night Sleep Mode (Protects backlight & darkens display at night)
  lcdSleepMode: false,
  lcdSleepStart: '23:30',
  lcdSleepEnd: '06:30',

  // Google Sync Web App URL (Google Apps Script)
  // This automatically streams BOTH your Google Calendar and Google Tasks 24x7!
  // Paste your published Google Apps Script Web App URL below:
  googleSyncUrl: 'https://script.google.com/macros/s/AKfycbzy7HO2UuQSnioblG8UJqtIyV4KPoX5kTvLL0m4tnrqZDlOIueU5VsZ4K-_43-Ka9px/exec',

  // Optional: Direct Google Calendar iCal (.ics) URL if used independently
  defaultCalendarUrl: '',

  // Smart Expense Tracker Integration
  // Connects directly to your expense tracker entry page & API
  expenseTrackerApiUrl: 'https://smartexpensetracker-vtkb.onrender.com',
  expenseTrackerSecret: '2546698',
};
