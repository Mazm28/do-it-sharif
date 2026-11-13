# Email reminders server

A Cloudflare Worker that emails users who turned on **Email a day before deadlines** in the ◐ menu. The extension uploads each such user's unfinished upcoming tasks whenever they change; every 15 minutes the Worker emails the ones that are now less than a day away (one email per user per run, never twice for the same deadline). It runs on Cloudflare's free plan and sends through [Resend](https://resend.com) (free: 3,000 emails a month).

The option stays hidden in the extension until `REMIND.url` in `email.js` is set.

## Setup

1. In Resend, add and verify a domain you own, and create an API key. (Without a domain, Resend only delivers to your own address.)
2. From this folder:

   ```bash
   npx wrangler login
   npx wrangler d1 create do-it-reminders      # copy the database_id into wrangler.toml
   npx wrangler d1 execute do-it-reminders --remote --file schema.sql
   npx wrangler secret put RESEND_KEY          # paste the Resend API key
   ```

3. In `wrangler.toml`, set `FROM` to an address on the verified domain.
4. `npx wrangler deploy`, then put the printed `https://do-it-reminders.<you>.workers.dev` in `ORIGIN` (wrangler.toml) and deploy again.
5. Put the same address in `REMIND.url` in `../email.js` and build the extension.

## How it works

| Request | What it does |
|---|---|
| `POST /subscribe` `{id, token, email, tz}` | Saves the address and emails a confirmation link. Nothing else is sent until it's clicked. |
| `GET /confirm?id&code` | The link in that email; turns reminders on. |
| `POST /tasks` `{id, token, tasks}` | Replaces the user's task list (`key, title, course, url, at`). Returns `on` or `pending`. |
| `POST /unsubscribe` `{id, token}` | Deletes the user and their tasks. |
| `GET /stop?id&code` | The "Stop these emails" link in every reminder; same as unsubscribe. |

`id` and `token` are random values the extension makes; a request without the matching token is refused. Logs: `npx wrangler tail`.
