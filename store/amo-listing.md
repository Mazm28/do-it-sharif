# Firefox Add-ons (AMO) — Do It (Sharif)

Publishing on addons.mozilla.org is free. Listed add-ons get a public page, one-click install and automatic updates.

## Upload

1. Run `./build.sh`, which makes `dist/do-it-<version>-firefox.zip`. Upload this file, **not** the Chrome zip.
2. Go to https://addons.mozilla.org/developers/ → **Submit a New Add-on** → **On this site**.
3. **Platforms:** Firefox only. Leave Android unticked.
4. **Source code:** answer **No**. The scripts aren't minified or bundled, so reviewers can read the package as is.
5. Fill in the listing below. Then paste the reviewer notes into **Notes to Reviewer** and submit.

For each new version: raise `"version"` in `manifest.json`, run `./build.sh`, then go to the add-on's page in the Developer Hub → **Upload New Version**. Users get it automatically.

## Listing

**Name:** Do It — Sharif

**Add-on URL:** `do-it-sharif`

**Summary** (max 250 characters):
> A simple course to-do list with a Persian (Jalali) calendar. It adds your CW (cw.sharif.ir) and Quera assignment deadlines automatically, including Quera's late-submission window.

**Description:**
> Do It keeps all your course work in one simple list, made for Sharif University students.
>
> • Add your courses and give each task a due date, picked from a Persian (Jalali) calendar.
> • Assignments from CW (cw.sharif.ir) and Quera (quera.org) are added for you, with their exact deadline time and a link to the assignment. The add-on checks every hour.
> • Assignments you have already submitted are ticked off automatically.
> • Quera assignments that still take late submissions get a red tag showing the real last moment.
> • A month calendar shows a dot for every task, and a "Next 7 days" list shows what's coming up.
> • If your CW login expires, deadlines keep coming in through your private CW calendar link, and a badge reminds you to log in again.
> • Colorful or minimal style, with light and dark mode.
>
> Click the toolbar icon to open your list. Log in to CW and Quera in Firefox as usual; the add-on uses that login and never sees your password.
>
> Privacy: your tasks stay on your computer. The add-on has no server. The only thing it sends is an anonymous once-a-day "active" count, which you can turn off.

**Categories:** Alerts & Updates (AMO has no "Other" to combine it with)

**Tags:** university, todo, deadlines, calendar, sharif

**Support email:** ali.meschi24@sharif.edu

**Support website:** https://github.com/Mazm28/do-it-sharif

**License:** MIT License (same as `LICENSE` in the repo)

**Privacy policy:** tick "This add-on has a privacy policy" and paste the English part of `store/privacy-policy.md`. It is also published at https://mazm28.github.io/do-it-sharif/store/privacy-policy.html

**Screenshots:** `store/screenshots/1-colorful.png` to `4-minimal-dark.png` (1280×800)

**Icon:** `icons/icon128.png`

## Notes to Reviewer

> This add-on is a to-do list for students of Sharif University of Technology (Iran). It reads the student's own upcoming assignments from two sites they already use, with the login session already in the browser:
>
> - CW (cw.sharif.ir, the university's Moodle): Moodle's own AJAX web service `core_calendar_get_action_events_by_timesort` (sync.js, fetchCwSession). If the session has expired, it uses the private calendar export link that Moodle generates for the user (fetchCwIcal).
> - Quera (quera.org): the data embedded in the user's own class pages (sync.js, fetchQuera, fetchQueraLate).
>
> Both need a Sharif student account, so reviewers can't test the sync. Without it, the add-on still works as a plain to-do list: click the toolbar icon, then add a course and tasks. The sync bar will say "log in to sync".
>
> Data: tasks are stored only in storage.local. The only data sent anywhere is an optional daily Google Analytics Measurement Protocol event in telemetry.js. It contains a random install ID, the version, and whether CW/Quera are connected (yes/no). It is declared as optional `technicalAndInteraction` in `data_collection_permissions`. It is skipped unless that permission is granted, and it can also be turned off in the app's settings menu.
>
> No remote code. The extension page loads the Vazirmatn font stylesheet from Google Fonts only.
>
> Source: https://github.com/Mazm28/do-it-sharif. The package is built by build.sh, which only zips the files and rewrites manifest.json for Firefox; there is no bundling or minification.
