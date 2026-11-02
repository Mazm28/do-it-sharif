importScripts('sync.js', 'update.js');

// Clicking the toolbar icon opens the app (or focuses it if already open)
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('index.html');
  const [tab] = await chrome.tabs.query({ url });
  if (tab) {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
  } else {
    chrome.tabs.create({ url });
  }
  syncAll();
  checkForUpdate();
});

// Check for new assignments every hour, and whenever the browser starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('sync', { periodInMinutes: 60 });
  chrome.alarms.create('update', { periodInMinutes: 12 * 60 });
  syncAll();
  checkForUpdate();
});
chrome.runtime.onStartup.addListener(() => { syncAll(); checkForUpdate(); });
chrome.alarms.onAlarm.addListener(a => {
  if (a.name === 'sync') syncAll();
  if (a.name === 'update') checkForUpdate();
});

// The app page asks for a sync with the "Sync now" button
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg === 'sync') { syncAll().then(reply); return true; }
});

// Clicking a notification opens the login page (expired login) or the release page (update)
chrome.notifications.onClicked.addListener(async id => {
  const source = id.startsWith('login:') && id.slice(6);
  if (LOGIN_URLS[source]) chrome.tabs.create({ url: LOGIN_URLS[source] });
  if (id === 'update') {
    const info = (await chrome.storage.local.get(UPDATE_KEY))[UPDATE_KEY];
    if (info?.url) chrome.tabs.create({ url: info.url });
  }
  chrome.notifications.clear(id);
});

// As soon as the user is back on CW or Quera after a login, sync again
chrome.tabs.onUpdated.addListener(async (_id, change, tab) => {
  if (change.status !== 'complete' || !tab.url || /\/login|\/accounts\//.test(tab.url)) return;
  const source = tab.url.startsWith(CW) ? 'cw' : tab.url.startsWith(QUERA) ? 'quera' : null;
  if (!source) return;
  const status = (await chrome.storage.local.get(STATUS_KEY))[STATUS_KEY] || {};
  if (needsLogin(status[source])) syncAll();
});
