// Do It email reminders: the extension uploads each opted-in user's unfinished upcoming tasks,
// and every 15 minutes this emails the ones that are now less than a day away.
const DAY = 86400000;
const MAX_TASKS = 200;
const RESEND_AFTER = 5 * 60000; // at most one confirmation email per 5 minutes per install

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const page = (title, text) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title>` +
  `<body style="font-family:system-ui,sans-serif;max-width:420px;margin:15vh auto;padding:0 16px;text-align:center">` +
  `<h1 style="font-size:24px">${title}</h1><p style="color:#666">${text}</p>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const str = (s, n) => String(s ?? '').slice(0, n);
const randomHex = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
const validEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e);
const validTz = tz => { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } };

async function sendEmail(env, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend: HTTP ${res.status} ${await res.text()}`);
}

// The subscriber's row, if the request carries its token
async function owner(env, id, token) {
  const sub = typeof id === 'string' && await env.DB.prepare('SELECT * FROM subscribers WHERE id = ?').bind(id).first();
  return sub && sub.token === token ? sub : null;
}

// ---- API (called by the extension) ----
async function subscribe(env, url, { id, token, email, tz }) {
  if (!/^[0-9a-f-]{36}$/.test(id || '') || !/^[0-9a-f]{32}$/.test(token || '') || !validEmail(email)) return json({ error: 'bad request' }, 400);
  tz = validTz(tz) ? tz : 'Asia/Tehran';
  const sub = await env.DB.prepare('SELECT * FROM subscribers WHERE id = ?').bind(id).first();
  if (sub && sub.token !== token) return json({ error: 'forbidden' }, 403);
  if (sub?.email === email && sub.confirmed) return json({ state: 'on' });
  if (sub?.email === email && Date.now() - sub.code_at < RESEND_AFTER) return json({ state: 'pending' });

  const code = randomHex();
  await env.DB.prepare(`INSERT INTO subscribers (id, token, email, tz, confirmed, code, code_at) VALUES (?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT (id) DO UPDATE SET email = excluded.email, tz = excluded.tz, confirmed = 0, code = excluded.code, code_at = excluded.code_at`)
    .bind(id, token, email, tz, code, Date.now()).run();
  const link = `${url.origin}/confirm?id=${id}&code=${code}`;
  await sendEmail(env, email, 'Confirm your Do It reminders',
    `<p>Click to get an email a day before each assignment in Do It is due:</p>` +
    `<p><a href="${link}" style="display:inline-block;padding:10px 18px;border-radius:10px;background:#6c5ce7;color:#fff;text-decoration:none;font-weight:600">Turn on reminders</a></p>` +
    `<p style="color:#888;font-size:13px">If you didn't ask for this, ignore this email and nothing will be sent.</p>`);
  return json({ state: 'pending' });
}

async function upload(env, { id, token, tasks }) {
  const sub = await owner(env, id, token);
  if (!sub) return json({ error: 'forbidden' }, 403);
  if (!Array.isArray(tasks)) return json({ error: 'bad request' }, 400);
  const rows = tasks.slice(0, MAX_TASKS)
    .filter(t => t && typeof t.key === 'string' && Number.isFinite(t.at))
    .map(t => [str(t.key, 64), str(t.title, 300), str(t.course, 200), /^https:\/\//.test(t.url) ? str(t.url, 500) : '', Math.round(t.at)]);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM reminders WHERE sub_id = ? AND key NOT IN (SELECT value FROM json_each(?))').bind(id, JSON.stringify(rows.map(r => r[0]))),
    // A moved deadline gets a new reminder
    ...rows.map(r => env.DB.prepare(`INSERT INTO reminders (sub_id, key, title, course, url, at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (sub_id, key) DO UPDATE SET title = excluded.title, course = excluded.course, url = excluded.url,
        sent = CASE WHEN at = excluded.at THEN sent ELSE 0 END, at = excluded.at`).bind(id, ...r)),
  ]);
  return json({ state: sub.confirmed ? 'on' : 'pending' });
}

async function unsubscribe(env, { id, token }) {
  if (!await owner(env, id, token)) return json({ ok: true }); // already gone
  await removeSubscriber(env, id);
  return json({ ok: true });
}

const removeSubscriber = (env, id) => env.DB.batch([
  env.DB.prepare('DELETE FROM reminders WHERE sub_id = ?').bind(id),
  env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(id),
]);

// ---- Links in the emails ----
async function byCode(env, url) {
  const id = url.searchParams.get('id'), code = url.searchParams.get('code');
  const sub = id && await env.DB.prepare('SELECT * FROM subscribers WHERE id = ?').bind(id).first();
  return sub && sub.code === code ? sub : null;
}

async function confirm(env, url) {
  const sub = await byCode(env, url);
  if (!sub) return page('Link expired', 'Turn reminders on again from the ◐ menu in Do It.');
  await env.DB.prepare('UPDATE subscribers SET confirmed = 1 WHERE id = ?').bind(sub.id).run();
  return page('Reminders are on ✓', `You'll get an email at ${esc(sub.email)} a day before each deadline.`);
}

async function stop(env, url) {
  const sub = await byCode(env, url);
  if (sub) await removeSubscriber(env, sub.id);
  return page('Reminders are off', 'You won\'t get any more emails. You can turn them on again from the ◐ menu in Do It.');
}

// ---- The reminder emails ----
function fmtDue(at, tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-persian', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(at)).map(p => [p.type, p.value]));
  return `${parts.weekday}, ${parts.day} ${parts.month} · ${parts.hour}:${parts.minute}`;
}

function reminderEmail(origin, sub, tasks) {
  const items = tasks.map(t => {
    const title = t.url ? `<a href="${esc(t.url)}" style="color:#6c5ce7">${esc(t.title)}</a>` : esc(t.title);
    return `<li style="margin-bottom:10px"><b dir="auto">${title}</b><br><span dir="auto" style="color:#666">${esc(t.course)}</span>` +
      ` · <span style="color:#e0475b">${esc(fmtDue(t.at, sub.tz))}</span></li>`;
  }).join('');
  const subject = tasks.length === 1 ? `Less than a day left: ${tasks[0].title}` : `${tasks.length} assignments due within a day`;
  const html = `<p>Less than a day left for:</p><ul style="padding-left:20px">${items}</ul>` +
    `<p style="color:#888;font-size:13px">Sent by Do It. <a href="${origin}/stop?id=${sub.id}&code=${sub.code}" style="color:#888">Stop these emails</a></p>`;
  return { subject, html };
}

async function sendDue(env, origin) {
  const now = Date.now();
  const { results } = await env.DB.prepare(`SELECT r.*, s.email, s.tz, s.code FROM reminders r JOIN subscribers s ON s.id = r.sub_id
    WHERE r.sent = 0 AND s.confirmed = 1 AND r.at > ? AND r.at <= ? ORDER BY r.at`).bind(now, now + DAY).all();
  const bySub = new Map();
  for (const r of results) bySub.set(r.sub_id, [...(bySub.get(r.sub_id) || []), r]);
  for (const [subId, tasks] of bySub) {
    const sub = { id: subId, email: tasks[0].email, tz: tasks[0].tz, code: tasks[0].code };
    try {
      const { subject, html } = reminderEmail(origin, sub, tasks);
      await sendEmail(env, sub.email, subject, html);
      await env.DB.batch(tasks.map(t => env.DB.prepare('UPDATE reminders SET sent = 1 WHERE sub_id = ? AND key = ? AND at = ?').bind(subId, t.key, t.at)));
    } catch (e) {
      console.error(subId, e); // retried on the next run
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method === 'GET' && url.pathname === '/confirm') return confirm(env, url);
    if (request.method === 'GET' && url.pathname === '/stop') return stop(env, url);
    if (request.method !== 'POST') return new Response('Not found', { status: 404 });
    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
    try {
      if (url.pathname === '/subscribe') return await subscribe(env, url, body);
      if (url.pathname === '/tasks') return await upload(env, body);
      if (url.pathname === '/unsubscribe') return await unsubscribe(env, body);
    } catch (e) {
      console.error(e);
      return json({ error: 'server error' }, 500);
    }
    return new Response('Not found', { status: 404 });
  },
  // A cron run has no request URL, so the "stop" link uses ORIGIN from wrangler.toml
  async scheduled(_event, env) {
    await sendDue(env, env.ORIGIN);
  },
};

export { fmtDue, reminderEmail, validEmail };
