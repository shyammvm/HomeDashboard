// Aether Dashboard — Centralized Configuration Loader
// User settings, coordinates, names, and preferences are loaded directly from dashboard-settings.json.
// To update coordinates, names, or settings, edit: dashboard-settings.json

import defaultSettings from '../dashboard-settings.json';

export const DASHBOARD_CONFIG = {
  // Load everything directly from dashboard-settings.json (Single Source of Truth)
  ...defaultSettings,

  // Commute & Telemetry compatibility getters (pointing directly to settings)
  get home() {
    return {
      alias: this.city || 'Home',
      coordinates: this.homeAddress || '12.971211, 77.735895',
    };
  },
  get work() {
    return {
      alias: this.officeName || 'Office',
      coordinates: this.officeAddress || '12.919583, 77.671528',
    };
  },
};
