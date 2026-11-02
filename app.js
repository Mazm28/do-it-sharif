// ---- Jalali (Persian) calendar conversion ----
function g2j(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * ~~(days / 12053);
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) { jy += ~~((days - 1) / 365); days = (days - 1) % 365; }
  return days < 186
    ? [jy, 1 + ~~(days / 31), 1 + (days % 31)]
    : [jy, 7 + ~~((days - 186) / 30), 1 + ((days - 186) % 30)];
}
function j2g(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + 365 * jy + ~~(jy / 33) * 8 + ~~(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * ~~(days / 146097);
  days %= 146097;
  if (days > 36524) { gy += 100 * ~~(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) { gy += ~~((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const ml = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && gd > ml[gm]) gd -= ml[gm++];
  return [gy, gm, gd];
}
const pad = n => String(n).padStart(2, '0');
const isoFromJ = (jy, jm, jd) => { const [y, m, d] = j2g(jy, jm, jd); return `${y}-${pad(m)}-${pad(d)}`; };
const jFromIso = iso => g2j(...iso.split('-').map(Number));
const jMonthLength = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : (g2j(...j2g(jy, 12, 30))[2] === 30 ? 30 : 29);

// ---- Language ----
const STR = {
  en: {
    title: 'Do It', switchTo: 'فارسی', addCoursePh: 'Add a course or topic…', addCourse: 'Add course',
    newTask: 'New task…', dueDate: 'Due date', add: 'Add', del: 'Delete', delCourse: 'Delete course', delTask: 'Delete task',
    confirmDel: n => `Delete "${n}" and all its tasks?`, markDone: 'Mark as done', markUndone: 'Mark as not done',
    noDate: 'no date', overdue: l => `overdue · ${l}`, today: 'today', tomorrow: 'tomorrow', inDays: n => `in ${n} days`,
    doneOf: (d, t) => `${d}/${t} done`, noTasks: 'no tasks yet', allDone: 'All caught up 🎉',
    toDo: n => `${n} task${n > 1 ? 's' : ''} to do`, dueNow: n => ` · ${n} due today or overdue`,
    empty: 'Add your first course above to get started.', pickToday: 'Today', pickNone: 'No date',
    months: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    wdShort: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
    syncNow: 'Sync now', syncing: 'Syncing…', never: 'not synced yet',
    syncedAgo: m => m < 1 ? 'synced just now' : m < 60 ? `synced ${m} min ago` : `synced ${Math.floor(m / 60)} h ago`,
    added: n => ` · ${n} new`, newVersion: v => `🎉 Version ${v} is out`, getIt: 'Download', login: 'log in to sync', limited: 'from calendar link ·', loginFull: 'log in for full sync', syncFailed: 'sync failed',
  },
  fa: {
    title: 'Do It', switchTo: 'English', addCoursePh: 'یک درس یا موضوع اضافه کن…', addCourse: 'افزودن درس',
    newTask: 'کار جدید…', dueDate: 'مهلت', add: 'افزودن', del: 'حذف', delCourse: 'حذف درس', delTask: 'حذف کار',
    confirmDel: n => `«${n}» و همه‌ی کارهایش حذف شود؟`, markDone: 'انجام شد', markUndone: 'انجام نشده',
    noDate: 'بدون تاریخ', overdue: l => `گذشته · ${l}`, today: 'امروز', tomorrow: 'فردا', inDays: n => `${n} روز دیگر`,
    doneOf: (d, t) => `${d} از ${t} انجام شده`, noTasks: 'هنوز کاری نیست', allDone: 'همه‌ی کارها انجام شده 🎉',
    toDo: n => `${n} کار مانده`, dueNow: n => ` · ${n} کار برای امروز یا عقب‌افتاده`,
    empty: 'برای شروع، اولین درست را بالا اضافه کن.', pickToday: 'امروز', pickNone: 'بدون تاریخ',
    months: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    weekdays: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
    wdShort: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
    syncNow: 'همگام‌سازی', syncing: 'در حال همگام‌سازی…', never: 'هنوز همگام نشده',
    syncedAgo: m => m < 1 ? 'همین الان همگام شد' : m < 60 ? `${m} دقیقه پیش همگام شد` : `${Math.floor(m / 60)} ساعت پیش همگام شد`,
    added: n => ` · ${n} مورد جدید`, newVersion: v => `🎉 نسخه‌ی ${v} آمده`, getIt: 'دانلود', login: 'برای همگام‌سازی وارد شو', limited: 'از لینک تقویم ·', loginFull: 'برای همگام‌سازی کامل وارد شو', syncFailed: 'همگام‌سازی نشد',
  },
};
const LANG_KEY = 'doit-lang';
let lang = (() => {
  try { const v = localStorage.getItem(LANG_KEY); if (STR[v]) return v; } catch {}
  return navigator.language.startsWith('fa') ? 'fa' : 'en';
})();
let T = STR[lang];
// Persian digits in Farsi mode; never applied to user-typed text
const num = x => lang === 'fa' ? String(x).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(x);
const todayIso = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
const fmtJ = (iso, withYear) => {
  const [jy, jm, jd] = jFromIso(iso);
  return `${num(jd)} ${T.months[jm - 1]}` + (withYear ? ` ${num(jy)}` : '');
};

// ---- Data ----
const KEY = 'doit-data';
const DISMISSED_KEY = 'doit-dismissed';
const STATUS_KEY = 'doit-sync';
const UPDATE_KEY = 'doit-update';
const COLORS = ['#6c5ce7', '#00a884', '#f0643c', '#2f80ed', '#e84393', '#d98a00', '#0fb5ae', '#8e44ad'];
// Inside the extension, data lives in chrome.storage so the background sync can add tasks
const store = globalThis.chrome?.storage?.local;
let courses = [];

async function load() {
  if (store) return (await store.get(KEY))[KEY] || [];
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save() {
  if (store) store.set({ [KEY]: courses });
  else try { localStorage.setItem(KEY, JSON.stringify(courses)); } catch {}
  render();
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function dueInfo({ due: date, time, done }) {
  if (!date) return { text: T.noDate, cls: '' };
  const at = time ? ` · ${num(time)}` : '';
  const days = Math.round((new Date(date + 'T00:00') - new Date(todayIso() + 'T00:00')) / 86400000);
  const [jy] = jFromIso(date), [ty] = jFromIso(todayIso());
  const label = fmtJ(date, jy !== ty);
  if (done) return { text: label + at, cls: '' }; // finished work is never "overdue"
  if (days < 0) return { text: T.overdue(label), cls: 'overdue' };
  if (days === 0) return { text: T.today + at, cls: 'soon' };
  if (days === 1) return { text: T.tomorrow + at, cls: 'soon' };
  if (days <= 3) return { text: T.inDays(num(days)) + at, cls: 'soon' };
  return { text: label + at, cls: '' };
}

// Unfinished tasks first, then by due date (no date last)
function sortTasks(tasks) {
  return [...tasks].sort((a, b) =>
    (a.done - b.done) || ((a.due || '9999') + (a.time || '')).localeCompare((b.due || '9999') + (b.time || '')));
}

function el(tag, props = {}, ...children) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
}

// ---- Date picker ----
let picker = null;
function closePicker() { picker?.remove(); picker = null; }

function openPicker(anchor, value, onPick) {
  closePicker();
  let [vy, vm] = jFromIso(value || todayIso());
  picker = el('div', { className: 'picker' });
  picker.onclick = e => e.stopPropagation();

  const draw = () => {
    const today = todayIso();
    const first = new Date(isoFromJ(vy, vm, 1) + 'T00:00');
    const offset = (first.getDay() + 1) % 7; // weeks start on Saturday
    const grid = el('div', { className: 'grid' },
      ...T.wdShort.map((d, i) => el('div', { className: 'wd' + (i === 6 ? ' fri' : ''), textContent: d })),
      ...Array.from({ length: offset }, () => el('div')));
    for (let d = 1; d <= jMonthLength(vy, vm); d++) {
      const iso = isoFromJ(vy, vm, d);
      grid.append(el('button', {
        type: 'button', textContent: num(d),
        className: (iso === today ? 'today ' : '') + (iso === value ? 'sel' : ''),
        onclick: () => { onPick(iso); closePicker(); }
      }));
    }
    const rtl = lang === 'fa';
    const step = n => { vm += n; if (vm > 12) { vm = 1; vy++; } if (vm < 1) { vm = 12; vy--; } draw(); };
    picker.replaceChildren(
      el('div', { className: 'picker-head' },
        el('button', { type: 'button', textContent: rtl ? '›' : '‹', onclick: () => step(-1) }),
        el('strong', { textContent: `${T.months[vm - 1]} ${num(vy)}` }),
        el('button', { type: 'button', textContent: rtl ? '‹' : '›', onclick: () => step(1) })),
      grid,
      el('div', { className: 'picker-foot' },
        el('button', { type: 'button', textContent: T.pickToday, onclick: () => { onPick(today); closePicker(); } }),
        el('button', { type: 'button', textContent: T.pickNone, onclick: () => { onPick(''); closePicker(); } })));
  };
  draw();
  document.body.append(picker);

  const r = anchor.getBoundingClientRect();
  const w = picker.offsetWidth, h = picker.offsetHeight;
  const x = lang === 'fa' ? r.left : r.right - w;
  picker.style.left = scrollX + Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
  picker.style.top = scrollY + (r.bottom + h + 8 < innerHeight ? r.bottom + 6 : Math.max(8, r.top - h - 6)) + 'px';
}
document.addEventListener('click', () => { closePicker(); hideTip(); });
addEventListener('scroll', () => hideTip(), { passive: true });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });

// ---- Render ----
const progress = new Map(); // course id -> last shown progress %
const longDate = iso => `${T.weekdays[new Date(iso + 'T00:00').getDay()]}${lang === 'fa' ? '، ' : ', '}${fmtJ(iso, true)}`;
const colorOf = c => COLORS[courses.indexOf(c) % COLORS.length];

// ---- Calendar ----
let calY, calM; // Jalali month on show
let tip = null;
function hideTip() { tip?.remove(); tip = null; }

function showTip(cell, iso, items) {
  hideTip();
  tip = el('div', { className: 'tip' }, el('strong', { textContent: longDate(iso) }),
    ...items.map(({ task, course }) => {
      const dot = el('span', { className: 'dot' });
      dot.style.background = colorOf(course);
      return el('div', { className: 'tip-item' + (task.done ? ' done' : '') }, dot,
        el('div', {},
          el('div', { className: 't-name', textContent: task.name }),
          el('div', { className: 't-course', textContent: course.name + (task.time ? ' · ' + num(task.time) : '') })));
    }));
  document.body.append(tip);
  const r = cell.getBoundingClientRect();
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
  tip.style.top = (r.bottom + h + 8 < innerHeight ? r.bottom + 6 : Math.max(8, r.top - h - 6)) + 'px';
}

function renderCalendar() {
  hideTip();
  const today = todayIso();
  if (calY === undefined) [calY, calM] = jFromIso(today);

  const byDay = new Map();
  for (const course of courses) for (const task of course.tasks) {
    if (task.due) byDay.set(task.due, [...(byDay.get(task.due) || []), { task, course }]);
  }

  const offset = (new Date(isoFromJ(calY, calM, 1) + 'T00:00').getDay() + 1) % 7; // weeks start on Saturday
  const grid = el('div', { className: 'cal-grid' },
    ...T.wdShort.map((d, i) => el('div', { className: 'wd' + (i === 6 ? ' fri' : ''), textContent: d })),
    ...Array.from({ length: offset }, () => el('div')));
  for (let d = 1; d <= jMonthLength(calY, calM); d++) {
    const iso = isoFromJ(calY, calM, d);
    const items = (byDay.get(iso) || []).sort((a, b) =>
      (a.task.done - b.task.done) || (a.task.time || '99').localeCompare(b.task.time || '99'));
    const dots = items.slice(0, 4).map(({ task, course }) => {
      const s = el('span', { className: task.done ? 'done' : '' });
      s.style.background = colorOf(course);
      return s;
    });
    if (items.length > 4) dots.push(el('small', { dir: 'ltr', textContent: '+' + num(items.length - 4) }));
    const cell = el('div', {
      className: 'day' + (iso === today ? ' today' : iso < today ? ' past' : '') + (items.length ? ' has' : ''),
    }, el('span', { className: 'num', textContent: num(d) }), el('div', { className: 'dots' }, ...dots));
    if (items.length) {
      cell.tabIndex = 0;
      cell.onpointerenter = e => { if (e.pointerType === 'mouse') showTip(cell, iso, items); };
      cell.onpointerleave = e => { if (e.pointerType === 'mouse') hideTip(); };
      cell.onclick = e => { e.stopPropagation(); showTip(cell, iso, items); }; // touch screens
      cell.onfocus = () => showTip(cell, iso, items);
      cell.onblur = hideTip;
    }
    grid.append(cell);
  }

  const rtl = lang === 'fa';
  const step = n => { calM += n; if (calM > 12) { calM = 1; calY++; } if (calM < 1) { calM = 12; calY--; } renderCalendar(); };
  document.getElementById('calendar').replaceChildren(
    el('div', { className: 'cal-head' },
      el('button', { type: 'button', textContent: rtl ? '›' : '‹', onclick: () => step(-1) }),
      el('strong', { textContent: `${T.months[calM - 1]} ${num(calY)}`, title: T.pickToday,
        onclick: () => { [calY, calM] = jFromIso(today); renderCalendar(); } }),
      el('button', { type: 'button', textContent: rtl ? '‹' : '›', onclick: () => step(1) })),
    grid);
}

function render() {
  const t = todayIso();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.title = T.title;
  document.getElementById('title').replaceChildren(T.title, el('span', { textContent: '.' }));
  document.getElementById('lang').textContent = T.switchTo;
  document.getElementById('course-name').placeholder = T.addCoursePh;
  document.getElementById('add-course-btn').textContent = T.addCourse;
  document.getElementById('today').textContent = longDate(t);
  renderCalendar();
  const open = courses.flatMap(c => c.tasks).filter(x => !x.done);
  const dueSoon = open.filter(x => x.due && x.due <= t).length;
  document.getElementById('summary').textContent = !courses.length ? ''
    : open.length === 0 ? T.allDone
    : T.toDo(num(open.length)) + (dueSoon ? T.dueNow(num(dueSoon)) : '');

  const root = document.getElementById('courses');
  root.replaceChildren();
  if (!courses.length) {
    root.append(el('div', { className: 'empty' },
      el('div', { className: 'big', textContent: '📚' }),
      el('p', { textContent: T.empty })));
    return;
  }
  courses.forEach((c, i) => {
    const total = c.tasks.length, done = c.tasks.filter(x => x.done).length;
    const head = el('div', { className: 'course-head' },
      el('span', { className: 'dot' }),
      el('h2', { textContent: c.name }),
      el('span', { className: 'count', textContent: total ? T.doneOf(num(done), num(total)) : T.noTasks }),
      el('button', {
        className: 'icon-btn', textContent: T.del, title: T.delCourse,
        onclick: () => { if (confirm(T.confirmDel(c.name))) { courses = courses.filter(x => x !== c); save(); } }
      }));
    // The bar starts at its previous value and slides to the new one
    const pct = total ? (done / total) * 100 : 0;
    const fill = el('div');
    fill.style.width = `${progress.get(c.id) ?? pct}%`;
    progress.set(c.id, pct);
    const bar = el('div', { className: 'progress' }, fill);

    const list = el('ul');
    for (const task of sortTasks(c.tasks)) {
      const info = dueInfo(task);
      list.append(el('li', { className: task.done ? 'done' : '' },
        el('button', { className: 'check', title: task.done ? T.markUndone : T.markDone,
          onclick: () => { task.done = !task.done; save(); } }),
        task.url
          ? el('a', { className: 'name', href: task.url, target: '_blank', rel: 'noopener', textContent: task.name })
          : el('span', { className: 'name', textContent: task.name }),
        el('span', { className: 'due ' + info.cls, textContent: info.text }),
        el('button', { className: 'icon-btn', textContent: '✕', title: T.delTask,
          onclick: () => { c.tasks = c.tasks.filter(x => x !== task); if (task.extId) dismiss(task.extId); save(); } })));
    }

    let due = '';
    const name = el('input', { type: 'text', placeholder: T.newTask, required: true });
    const dateBtn = el('button', { type: 'button', className: 'date-btn', textContent: '📅 ' + T.dueDate });
    dateBtn.onclick = e => {
      e.stopPropagation();
      if (picker) return closePicker();
      openPicker(dateBtn, due, iso => {
        due = iso;
        dateBtn.textContent = '📅 ' + (iso ? fmtJ(iso) : T.dueDate);
        dateBtn.classList.toggle('set', !!iso);
      });
    };
    const form = el('form', { className: 'row task',
      onsubmit: e => {
        e.preventDefault();
        if (!name.value.trim()) return;
        c.tasks.push({ id: uid(), name: name.value.trim(), due, done: false });
        save();
        document.querySelector(`[data-course="${c.id}"] input[type=text]`)?.focus();
      } }, name, dateBtn, el('button', { className: 'btn', textContent: T.add }));
    form.dataset.course = c.id;

    const section = el('section', { className: 'course' }, head, bar, total ? list : '', form);
    section.style.setProperty('--c', COLORS[i % COLORS.length]);
    root.append(section);
    fill.offsetWidth; // apply the starting width before changing it, so the transition runs
    fill.style.width = `${pct}%`;
  });
}

document.getElementById('add-course').onsubmit = e => {
  e.preventDefault();
  const input = document.getElementById('course-name');
  if (!input.value.trim()) return;
  courses.push({ id: uid(), name: input.value.trim(), tasks: [] });
  input.value = '';
  save();
};

document.getElementById('lang').onclick = () => {
  lang = lang === 'fa' ? 'en' : 'fa';
  T = STR[lang];
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  store?.set({ [LANG_KEY]: lang }); // background notifications use the same language
  closePicker();
  render();
  renderSync();
  renderUpdate();
};

// Imported tasks the user deleted stay deleted on the next sync
async function dismiss(extId) {
  const list = (await store.get(DISMISSED_KEY))[DISMISSED_KEY] || [];
  store.set({ [DISMISSED_KEY]: [...list, extId] });
}

// ---- Sync status (extension only) ----
let syncStatus = {}, syncing = false;
const SOURCES = [
  { key: 'cw', label: 'CW', login: 'https://cw.sharif.ir/login/index.php' },
  { key: 'quera', label: 'Quera', login: 'https://quera.org/accounts/login' },
];
function renderSync() {
  const bar = document.getElementById('sync');
  if (!store) return;
  const chips = SOURCES.map(({ key, label, login }) => {
    const s = syncStatus[key];
    const loginLink = textContent => el('a', { href: login, target: '_blank', rel: 'noopener', textContent });
    const text = !s ? el('span', { textContent: T.never })
      : s.limited ? el('span', {}, `${T.limited} `, loginLink(T.loginFull))
      : s.ok ? el('span', { textContent: T.syncedAgo(Math.floor((Date.now() - s.at) / 60000)) + (s.added ? T.added(num(s.added)) : '') })
      : s.error === 'login' ? loginLink(T.login)
      : el('span', { textContent: `${T.syncFailed}: ${s.message}` });
    return el('span', { className: 'source' + (s && (!s.ok || s.limited) ? ' bad' : '') }, el('b', { textContent: label }), text);
  });
  bar.hidden = false;
  bar.className = 'sync';
  bar.replaceChildren(...chips,
    el('button', { type: 'button', textContent: syncing ? T.syncing : T.syncNow, disabled: syncing, onclick: syncNow }));
}
// ---- New-version banner (extension only; set by the background update check) ----
let updateInfo = null;
function renderUpdate() {
  const link = document.getElementById('update');
  link.hidden = !updateInfo;
  if (!updateInfo) return;
  link.className = 'update';
  link.href = updateInfo.url;
  link.replaceChildren(el('span', { textContent: T.newVersion(num(updateInfo.version)) }), el('span', { textContent: T.getIt }));
}

async function syncNow() {
  syncing = true; renderSync();
  try { syncStatus = await chrome.runtime.sendMessage('sync') || syncStatus; } catch {}
  syncing = false; renderSync();
}
if (store) {
  store.get(STATUS_KEY).then(d => { syncStatus = d[STATUS_KEY] || {}; renderSync(); });
  store.get(UPDATE_KEY).then(d => { updateInfo = d[UPDATE_KEY] || null; renderUpdate(); });
  setInterval(renderSync, 60000);
}

// Re-render when the background sync changes the data (but not for our own saves)
store && chrome.storage.onChanged.addListener((changes, area) => {
  const next = changes[KEY]?.newValue;
  if (area === 'local' && changes[STATUS_KEY]) { syncStatus = changes[STATUS_KEY].newValue || {}; renderSync(); }
  if (area === 'local' && changes[UPDATE_KEY]) { updateInfo = changes[UPDATE_KEY].newValue || null; renderUpdate(); }
  if (area !== 'local' || !next || JSON.stringify(next) === JSON.stringify(courses)) return;
  courses = next;
  render();
});

render();
load().then(c => { courses = c; render(); });
store?.set({ [LANG_KEY]: lang });
