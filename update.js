// Checks GitHub Releases for a newer version, since installs from a zip don't update themselves
const RELEASES_API = 'https://api.github.com/repos/Mazm28/do-it-sharif/releases/latest';
const UPDATE_KEY = 'doit-update'; // { version, url, notified } when a newer release exists

// True when version a (like "0.10.1") is newer than b
function isNewer(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

const UPDATE_TEXT = { title: v => `Do It ${v} is available`, body: 'Click to download the new version.' };

async function checkForUpdate() {
  if (chrome.runtime.getBrowserInfo) return; // Firefox installs from AMO update themselves
  try {
    const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return;
    const release = await res.json();
    const latest = String(release.tag_name || '').replace(/^v/, '');
    if (!latest || !isNewer(latest, chrome.runtime.getManifest().version)) {
      await chrome.storage.local.set({ [UPDATE_KEY]: null });
      return;
    }
    const saved = (await chrome.storage.local.get(UPDATE_KEY))[UPDATE_KEY];
    const info = { version: latest, url: release.html_url, notified: saved?.version === latest && saved.notified };
    if (!info.notified) {
      chrome.notifications.create('update', {
        type: 'basic', iconUrl: 'icons/icon128.png',
        title: UPDATE_TEXT.title(latest), message: UPDATE_TEXT.body,
      });
      info.notified = true; // one notification per new version
    }
    await chrome.storage.local.set({ [UPDATE_KEY]: info });
  } catch {} // offline or rate-limited: try again next time
}

if (typeof module !== 'undefined') module.exports = { isNewer, checkForUpdate };
