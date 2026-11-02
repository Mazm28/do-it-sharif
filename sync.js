// Pulls assignments from CW (Moodle) and Quera into the to-do list. Runs in the background service worker.
const KEY = 'doit-data';
const DISMISSED_KEY = 'doit-dismissed'; // imported tasks the user deleted, so they aren't re-added
const STATUS_KEY = 'doit-sync';
const ICAL_KEY = 'doit-cw-ical'; // private calendar export link + course short names
const CW = 'https://cw.sharif.ir';
const QUERA = 'https://quera.org';

class SyncError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const clean = s => String(s ?? '').replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, m => ENTITIES[m]).trim();

function localDateTime(sec) {
  const d = new Date(sec * 1000);
  return { due: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

// CW: full sync through Moodle's Timeline API while the session is alive; when it has
// expired, fall back to the user's private calendar export link (no login needed)
async function fetchCw() {
  try {
    return await fetchCwSession();
  } catch (e) {
    const ical = (await chrome.storage.local.get(ICAL_KEY))[ICAL_KEY];
    if (e.code !== 'login' || !ical?.url) throw e;
    return { items: await fetchCwIcal(ical), limited: true };
  }
}

// Moodle's Timeline API: upcoming (and recently overdue) assignments and quizzes, minus submitted ones
async function fetchCwSession() {
  const page = await fetch(CW + '/my/', { credentials: 'include' });
  if (!page.ok) throw new SyncError('error', `CW page: HTTP ${page.status}`);
  const html = await page.text();
  const sesskey = html.match(/"sesskey":"([^"]+)"/)?.[1];
  if (page.url.includes('/login/') || !sesskey) throw new SyncError('login');

  const method = 'core_calendar_get_action_events_by_timesort';
  const res = await fetch(`${CW}/lib/ajax/service.php?sesskey=${sesskey}&info=${method}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ index: 0, methodname: method, args: {
      limitnum: 50,
      timesortfrom: Math.floor(Date.now() / 1000) - 14 * 86400,
    } }]),
  });
  if (!res.ok) throw new SyncError('error', `CW API: HTTP ${res.status}`);
  const body = await res.text();
  let r;
  try { [r] = JSON.parse(body); } catch { throw new SyncError('error', 'CW API: unexpected response: ' + body.slice(0, 120)); }
  if (r.error) {
    const code = r.exception?.errorcode;
    throw new SyncError(code === 'servicerequireslogin' ? 'login' : 'error', `CW API: ${code || ''} ${r.exception?.message || ''}`.trim());
  }

  const events = r.data.events;
  await saveIcalInfo(sesskey, events);
  return {
    items: events.map(e => ({
      extId: `cw:event:${e.id}`,
      legacyId: `cw:${e.modulename || 'event'}:${e.instance || e.id}`, // ids used before v0.4
      courseExt: `cw:${e.course.id}`,
      courseName: clean(e.course.fullname),
      name: clean(e.activityname || e.name),
      url: e.url,
      ...localDateTime(e.timesort),
    })),
    // The Timeline leaves out what no longer needs action, so upcoming CW tasks missing from it were submitted
    complete: 'cw:event:',
  };
}

// Remembers the calendar export link and each course's short name (iCal only knows short names)
async function saveIcalInfo(sesskey, events) {
  try {
    const ical = (await chrome.storage.local.get(ICAL_KEY))[ICAL_KEY] || {};
    ical.courses = { ...ical.courses };
    for (const e of events) ical.courses[e.course.shortname] = { ext: `cw:${e.course.id}`, name: clean(e.course.fullname) };
    if (!ical.url) {
      const form = new URLSearchParams({
        sesskey, _qf__core_calendar_export_form: '1',
        'events[exportevents]': 'all', 'period[timeperiod]': 'recentupcoming', generateurl: '1',
      });
      const html = await (await fetch(CW + '/calendar/export.php', { method: 'POST', credentials: 'include', body: form })).text();
      ical.url = html.match(/https?:\/\/[^"'<\s]*export_execute\.php\?[^"'<\s]*/)?.[0]?.replace(/&amp;/g, '&');
    }
    await chrome.storage.local.set({ [ICAL_KEY]: ical });
  } catch {} // the fallback is optional; never fail the main sync over it
}

async function fetchCwIcal(ical) {
  const res = await fetch(ical.url, { credentials: 'omit' });
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) {
    // The link stops working if the CW password changes; make a new one on the next full sync
    await chrome.storage.local.set({ [ICAL_KEY]: { ...ical, url: null } });
    throw new SyncError('login');
  }
  return icalItems(parseIcal(text), ical.courses || {}, Date.now());
}

function parseIcal(text) {
  return text.replace(/\r?\n[ \t]/g, '').split('BEGIN:VEVENT').slice(1).map(block => {
    const fields = {};
    for (const line of block.split(/\r?\n/)) {
      const m = line.match(/^([A-Z-]+)(?:;[^:]*)?:(.*)$/);
      if (m) fields[m[1]] = m[2].replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
    }
    return fields;
  });
}

// Moodle event titles: "موعد X سر رسیده است" (due), "X بسته می‌شود" (closes), "X باز می‌شود" (opens)
const ICAL_NAMES = [/^موعد (.+) سر رسیده است$/, /^(.+) بسته می‌?شود$/, /^بسته می‌?شود (.+)$/, /^(.+) is due$/i, /^(.+) closes$/i];
const ICAL_SKIP = /باز می‌?شود|opens$/i;

function icalTime(v) {
  const m = v?.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined) return { due: `${y}-${mo}-${d}`, time: '', ms: new Date(`${y}-${mo}-${d}T23:59`).getTime() };
  const ms = z ? Date.UTC(y, mo - 1, d, h, mi, s) : new Date(y, mo - 1, d, h, mi, s).getTime();
  return { ...localDateTime(ms / 1000), ms };
}

// Only upcoming deadlines: past ones in the export include already-submitted work
function icalItems(events, courses, now) {
  const items = [];
  for (const e of events) {
    const when = icalTime(e.DTSTART);
    const id = e.UID?.split('@')[0];
    if (!when || !id || when.ms < now || ICAL_SKIP.test(e.SUMMARY || '')) continue;
    const summary = e.SUMMARY || '';
    const name = ICAL_NAMES.map(re => summary.match(re)?.[1]).find(Boolean) || summary;
    const short = e.CATEGORIES || '';
    const course = courses[short] || { ext: `cw:short:${short}`, name: short || 'CW' };
    items.push({
      extId: `cw:event:${id}`, courseExt: course.ext, courseName: course.name, name: name.trim(),
      url: `${CW}/calendar/view.php?view=day&time=${Math.floor(when.ms / 1000)}`,
      due: when.due, time: when.time,
      partial: true, // existing tasks only get their date updated, keeping the richer name and link
    });
  }
  return items;
}

// Quera's class list page embeds the upcoming-deadlines widget data (Next.js __NEXT_DATA__)
async function fetchQuera() {
  const page = await fetch(QUERA + '/course', { credentials: 'include' });
  if (page.url.includes('/accounts/login')) throw new SyncError('login');
  if (!page.ok) throw new SyncError('error', `Quera: HTTP ${page.status}`);
  const html = await page.text();
  const json = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  const data = json && JSON.parse(json).props?.pageProps?.course;
  if (!data?.course_deadline_widget_data) throw new SyncError('error', 'Quera: unexpected page format');

  const courseIds = new Map((data.courses?.edges || []).map(e => [e.node.name, e.node.id]));
  return { items: data.course_deadline_widget_data.map(a => ({
    extId: `quera:${a.id}`,
    courseExt: `quera:${courseIds.get(a.course_name) ?? a.course_name}`,
    courseName: clean(a.course_name),
    name: clean(a.name),
    url: `${QUERA}/course/assignments/${a.id}/problems`,
    submitted: a.problems?.length > 0 && a.problems.every(p => p.state !== 'NO_SUBMIT'),
    ...localDateTime(Date.parse(a.finish_time) / 1000),
  })) };
}

// A course can be linked to both CW and Quera (older data stored a single `ext`)
const linksOf = c => c.exts || (c.ext ? [c.ext] : []);

// Adds new items to `courses` in place and updates changed dates. Only marks tasks done
// (when the site says it was submitted), never un-done. Returns how many were added.
function merge(courses, items, dismissed) {
  let added = 0;
  for (const item of items) {
    if (dismissed.has(item.extId) || dismissed.has(item.legacyId)) continue;
    let task = courses.flatMap(c => c.tasks).find(t => t.extId === item.extId || (item.legacyId && t.extId === item.legacyId));
    if (task && item.partial) { Object.assign(task, { due: item.due, time: item.time }); continue; }

    let course = courses.find(c => linksOf(c).includes(item.courseExt))
      || courses.find(c => c.name.trim() === item.courseName);
    if (!course) {
      course = { id: uid(), name: item.courseName, tasks: [] };
      courses.push(course);
    }
    course.exts = [...new Set([...linksOf(course), item.courseExt])];
    delete course.ext;

    const fields = { name: item.name, due: item.due, time: item.time, url: item.url };
    if (task) Object.assign(task, fields, { extId: item.extId });
    else {
      task = { id: uid(), extId: item.extId, done: false, ...fields };
      course.tasks.push(task);
      added++;
    }
    if (item.submitted) task.done = true;
  }
  return added;
}

// Upcoming tasks from a full sync's source that the site no longer lists were submitted
function markSubmitted(courses, prefix, present, now) {
  for (const task of courses.flatMap(c => c.tasks)) {
    if (!task.extId?.startsWith(prefix) || present.has(task.extId) || !task.due) continue;
    if (new Date(`${task.due}T${task.time || '23:59'}`).getTime() > now) task.done = true;
  }
}

const SOURCES = { cw: fetchCw, quera: fetchQuera };
let running = null;

function syncAll() {
  return running ??= doSync().finally(() => { running = null; });
}

async function doSync() {
  const status = (await chrome.storage.local.get(STATUS_KEY))[STATUS_KEY] || {};
  const before = structuredClone(status);
  for (const [name, fetchItems] of Object.entries(SOURCES)) {
    try {
      const { items, limited, complete } = await fetchItems();
      const data = await chrome.storage.local.get([KEY, DISMISSED_KEY]);
      const courses = data[KEY] || [];
      const added = merge(courses, items, new Set(data[DISMISSED_KEY] || []));
      if (complete) markSubmitted(courses, complete, new Set(items.map(i => i.extId)), Date.now());
      await chrome.storage.local.set({ [KEY]: courses });
      status[name] = { ok: true, at: Date.now(), added, ...(limited && { limited }) };
    } catch (e) {
      status[name] = { ok: false, at: Date.now(), error: e.code || 'error', message: String(e.message || e) };
    }
  }
  await chrome.storage.local.set({ [STATUS_KEY]: status });
  await updateAlerts(before, status);
  return status;
}

// ---- Expired-login alerts ----
const LOGIN_URLS = { cw: CW + '/login/index.php', quera: QUERA + '/accounts/login' };
const SOURCE_NAMES = { cw: 'CW', quera: 'Quera' };
const needsLogin = s => s?.error === 'login' || s?.limited;
const ALERT_TEXT = {
  en: { title: n => `Log in to ${n} again`, body: n => `Your ${n} session expired, so new assignments may be missed. Click to log in.` },
  fa: { title: n => `دوباره وارد ${n} شو`, body: n => `نشست ${n} منقضی شده و ممکن است تمرین‌های جدید جا بمانند. برای ورود کلیک کن.` },
};

async function updateAlerts(before, status) {
  const expired = Object.keys(SOURCES).filter(k => needsLogin(status[k]));
  await chrome.action.setBadgeText({ text: expired.length ? '!' : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#e0475b' });

  const lang = (await chrome.storage.local.get('doit-lang'))['doit-lang'] === 'fa' ? 'fa' : 'en';
  for (const k of expired) {
    if (needsLogin(before[k])) continue; // only notify when it newly expires
    chrome.notifications.create('login:' + k, {
      type: 'basic', iconUrl: 'icons/icon128.png', priority: 2,
      title: ALERT_TEXT[lang].title(SOURCE_NAMES[k]), message: ALERT_TEXT[lang].body(SOURCE_NAMES[k]),
    });
  }
  for (const k of Object.keys(SOURCES)) if (!needsLogin(status[k])) chrome.notifications.clear('login:' + k);
}

if (typeof module !== 'undefined') module.exports = { merge, markSubmitted, clean, localDateTime, needsLogin, parseIcal, icalItems };
