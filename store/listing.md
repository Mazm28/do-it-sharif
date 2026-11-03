# Chrome Web Store listing — Do It (Sharif)

Copy these into the Developer Dashboard. The app is in English; the Persian listing text is optional.

## Package

- **Upload:** `dist/do-it-<version>.zip`, made with `./build.sh`. Raise `"version"` in `manifest.json` before every new upload.
- **Category:** Productivity → Workflow & Planning
- **Language:** English (default), Persian

## Store listing — English

**Name:** Do It — Sharif

**Summary** (max 132 characters):
> Course to-do list with a Persian calendar that adds your CW and Quera assignment deadlines automatically.

**Description:**
> Do It keeps all your course work in one simple list, made for Sharif University students.
>
> • Add your courses and give each task a due date, picked from a Persian (Jalali) calendar.
> • Assignments from CW (cw.sharif.ir) and Quera (quera.org) are added for you, with their exact deadline time and a link to the assignment. The extension checks every hour.
> • Assignments you have already submitted are ticked off automatically.
> • A month calendar shows a dot for every task. Hover over or tap a day to see what's due.
> • Overdue and due-soon tasks are highlighted, and each course shows its progress.
> • If your CW login expires, deadlines keep coming in through your private CW calendar link. A badge reminds you to log in again.
> • Quera assignments that still take late submissions get a red tag with the real last moment.
> • Colorful or minimal style, with light and dark mode.
>
> Privacy: everything stays on your computer. The extension has no server, never sees your password, and only talks to CW and Quera to read your own assignments, using the login already in your browser.

## Store listing — فارسی

**نام:** Do It — Sharif

**خلاصه** (حداکثر ۱۳۲ نویسه):
> فهرست کارهای درسی با تقویم شمسی که مهلت تمرین‌های CW و Quera را خودکار اضافه می‌کند.

**توضیحات:**
> Do It همه‌ی کارهای درسی‌ات را در یک فهرست ساده جمع می‌کند و مخصوص دانشجوهای دانشگاه شریف ساخته شده.
>
> • درس‌هایت را اضافه کن و برای هر کار با تقویم شمسی مهلت بگذار.
> • تمرین‌های CW (cw.sharif.ir) و Quera (quera.org) خودکار اضافه می‌شوند، با ساعت دقیق مهلت و لینک مستقیم به تمرین. اکستنشن هر ساعت یک بار چک می‌کند.
> • تمرین‌هایی که فرستاده‌ای خودکار تیک می‌خورند.
> • یک تقویم ماهانه برای هر کار یک نقطه نشان می‌دهد. موس را روی یک روز نگه دار یا لمسش کن تا کارهای آن روز را ببینی.
> • کارهای عقب‌افتاده و نزدیک مشخص‌اند و هر درس نوار پیشرفت خودش را دارد.
> • اگر ورود CW منقضی شود، مهلت‌ها از لینک خصوصی تقویم CW همچنان می‌رسند و یک علامت یادآوری می‌کند دوباره وارد شوی.
> • تمرین‌های کوئرا که هنوز با تأخیر تحویل گرفته می‌شوند، با برچسب قرمز و مهلت واقعی نشان داده می‌شوند.
> • ظاهر رنگی یا ساده، با حالت روشن و تیره.
>
> حریم خصوصی: همه‌چیز روی کامپیوتر خودت می‌ماند. اکستنشن سرور ندارد، رمز عبورت را هیچ‌وقت نمی‌بیند، و فقط برای خواندن تمرین‌های خودت با همان ورودی مرورگرت به CW و Quera وصل می‌شود.

## Graphics

- **Store icon (128×128):** `icons/icon128.png`
- **Screenshots (1280×800):** `store/screenshots/` (colorful and minimal, light and dark)
- **Small promo tile (440×280):** optional; not made yet.

## Privacy practices tab

**Single purpose:**
> Keep a to-do list of university course tasks and automatically add assignment deadlines from the student's own CW (Moodle) and Quera accounts.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Saves the user's courses, tasks, settings and sync status locally on their computer. |
| `alarms` | Checks CW and Quera for new assignments once an hour in the background. |
| `notifications` | Tells the user once when their CW or Quera login has expired, so new assignments aren't missed. |
| Host `https://cw.sharif.ir/*`, `https://cw.sharif.edu/*` | Reads the user's own upcoming assignment deadlines from CW (the university's Moodle) with their existing browser login, and their private CW calendar link. `cw.sharif.edu` redirects to `cw.sharif.ir`. |
| Host `https://quera.org/*` | Reads the user's own upcoming assignment deadlines from their Quera classes page with their existing browser login. |

**Remote code:** No, I am not using remote code. All scripts are inside the package. The page only loads a font stylesheet from Google Fonts.

**Data usage:**
- Google counts data as "collected" only when it leaves the user's device. This extension sends nothing anywhere, so **none of the categories need to be ticked**. If the review asks about it, explain that assignment data read from CW/Quera ("Website content") is stored only locally.
- Tick all three certifications: data is not sold, not used for unrelated purposes, and not used for creditworthiness or lending.

**Privacy policy URL:** https://mazm28.github.io/do-it-sharif/store/privacy-policy.html (GitHub Pages, built from `store/privacy-policy.md`)
