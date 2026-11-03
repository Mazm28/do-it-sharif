// Anonymous usage count: once a day, tells Google Analytics "one install was active today".
// Sends only a random install ID, the version, and whether CW/Quera are connected — no names, tasks or accounts.
// Users can turn it off from the ◐ menu. Leave the IDs empty to disable it entirely.
const GA = {
  measurementId: 'G-S1K1WJB9T5', // G-XXXXXXXXXX (Admin → Data streams → your stream)
  apiSecret: 'LVfxqcgoRMiNLy3I1tucGA', // Admin → Data streams → your stream → Measurement Protocol API secrets
};
const CLIENT_KEY = 'doit-client-id';
const PING_KEY = 'doit-last-ping';
const STATS_OFF_KEY = 'doit-stats-off';

async function pingDaily() {
  if (!GA.measurementId || !GA.apiSecret) return;
  const today = new Date().toISOString().slice(0, 10);
  const data = await chrome.storage.local.get([CLIENT_KEY, PING_KEY, STATS_OFF_KEY, 'doit-sync']);
  if (data[STATS_OFF_KEY] || data[PING_KEY] === today) return;
  const clientId = data[CLIENT_KEY] || crypto.randomUUID();
  const status = data['doit-sync'] || {};
  try {
    const res = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA.measurementId}&api_secret=${GA.apiSecret}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        events: [{ name: 'daily_active', params: {
          version: chrome.runtime.getManifest().version,
          cw: status.cw?.ok ? 'yes' : 'no',
          quera: status.quera?.ok ? 'yes' : 'no',
          session_id: String(Date.now()),
          engagement_time_msec: 1, // GA only counts a user as "active" with this set
        } }],
      }),
    });
    if (res.ok) await chrome.storage.local.set({ [CLIENT_KEY]: clientId, [PING_KEY]: today });
  } catch {} // offline: try again on the next check
}

if (typeof module !== 'undefined') module.exports = { pingDaily, GA };
