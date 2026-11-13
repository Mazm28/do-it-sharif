// Optional email a day before each deadline, sent by the small server in server/.
// Only for users who turn it on: the server gets their email address and their unfinished
// upcoming tasks (name, course, link, deadline), nothing else. Loaded by both the app page and the background.
const REMIND = { url: '' }; // the deployed Worker, like https://do-it-reminders.<you>.workers.dev; empty hides the option
const EMAIL_KEY = 'doit-email'; // { id, token, address, state: 'pending' | 'on', sent }
const REMIND_AHEAD = 30 * 86400000; // upload deadlines up to a month away

async function remindApi(path, body) {
  const res = await fetch(REMIND.url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// Unfinished tasks with a deadline in the next month, in the shape the server stores
function reminderTasks(courses, now) {
  const tasks = [];
  for (const c of courses) for (const t of c.tasks) {
    if (t.done || !t.due) continue;
    const at = new Date(`${t.due}T${t.time || '23:59'}`).getTime();
    const late = t.late && new Date(`${t.late.due}T${t.late.time || '23:59'}`).getTime();
    const end = at <= now && late > now ? late : at; // past the deadline, but still taking late work
    if (end > now && end < now + REMIND_AHEAD) tasks.push({ key: t.id, title: t.name, course: c.name, url: t.url || '', at: end });
  }
  return tasks;
}

// Sends the confirmation email; reminders start once the link in it is clicked
async function emailSubscribe(address) {
  const saved = (await chrome.storage.local.get(EMAIL_KEY))[EMAIL_KEY] || {};
  const id = saved.id || crypto.randomUUID();
  const token = saved.token || [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { status, body } = await remindApi('/subscribe', { id, token, email: address, tz });
  if (status !== 200) throw new Error(body.error || `HTTP ${status}`);
  await chrome.storage.local.set({ [EMAIL_KEY]: { id, token, address, state: body.state } });
  await pushReminders();
}

async function emailUnsubscribe() {
  const saved = (await chrome.storage.local.get(EMAIL_KEY))[EMAIL_KEY];
  if (saved) await remindApi('/unsubscribe', { id: saved.id, token: saved.token });
  await chrome.storage.local.remove(EMAIL_KEY);
}

// Uploads the task list when it changed (and while waiting for confirmation, to learn when it's done)
async function pushReminders() {
  const data = await chrome.storage.local.get([EMAIL_KEY, 'doit-data']);
  const saved = data[EMAIL_KEY];
  if (!REMIND.url || !saved) return;
  const tasks = reminderTasks(data['doit-data'] || [], Date.now());
  const sent = JSON.stringify(tasks);
  if (saved.state === 'on' && saved.sent === sent) return;
  try {
    const { status, body } = await remindApi('/tasks', { id: saved.id, token: saved.token, tasks });
    // 403: turned off with the "stop" link in an email
    if (status === 403) await chrome.storage.local.remove(EMAIL_KEY);
    else if (status === 200) await chrome.storage.local.set({ [EMAIL_KEY]: { ...saved, state: body.state, sent } });
  } catch {} // offline: try again on the next sync
}

if (typeof module !== 'undefined') module.exports = { reminderTasks, pushReminders, emailSubscribe, emailUnsubscribe, REMIND, EMAIL_KEY };
