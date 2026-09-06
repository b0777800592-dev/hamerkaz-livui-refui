# me-lookup

Manual-assisted phone → name lookup on **Me Web** (<https://web.me.app>) using
Playwright, driven entirely through the real browser UI.

This tool does **not** use any private Me API, does **not** bypass CAPTCHA or
rate limits, and never asks for your password. You log in manually once; the
session is saved in a persistent browser profile and reused afterwards.

## Requirements

- Node.js 18+ (tested on 22)
- A machine with a screen (the browser opens **visibly** so you can log in)

## Install

```bash
npm install
npx playwright install chromium
```

## Run

```bash
node lookup.js
```

What happens:

1. A visible Chromium window opens at <https://web.me.app>.
2. If you are not logged in, the terminal prints
   `Please login to Me Web manually. When ready, press Enter in terminal.`
   Log in in the browser window, then press **Enter** in the terminal.
3. The script searches each number from `phones.json` in order, reads the name
   shown, and logs progress in real time:

   ```
   [1/54] Searching 0543090304
      Found: אודי אוחיון
   ```

4. It waits a random **2.5–4s** between searches.
5. If a CAPTCHA is detected it prints
   `CAPTCHA detected. Solve it manually and press Enter to continue.` — solve it
   in the browser, then press Enter.

## Output

- `me_results.csv` — final CSV, UTF-8 **with BOM** (opens correctly in Excel),
  columns: `index,phone,name,status`
- `me_results.json` — same data as JSON
- `results.partial.json` — written after **every** number (used for resume)

`status` is one of: `found`, `not_found`, `error`.
For `not_found` the `name` column is `לא נמצא`; for `error` it is `שגיאה`.

## Stop and resume

- **Stop:** press `Ctrl+C` in the terminal. Partial results are saved.
- **Resume:** just run `node lookup.js` again. Numbers already recorded in
  `results.partial.json` are skipped; it continues from where it stopped.
- **Start over:** delete `results.partial.json` (and the output files) and run
  again. Delete the `me-profile/` folder to also log out.

## Tuning selectors

Me Web is a single-page app whose markup may change. If the search field or the
result name are not detected on the first run:

- Open DevTools in the browser window and inspect the real elements.
- Adjust `findSearchInput()` (search box) and/or `extractName()` (result name)
  near the top of `lookup.js`. The `debug` lines logged on errors show the raw
  text the script saw, which makes tuning easy.

Set `HEADLESS=1 node lookup.js` only for a quick launch smoke-test — you cannot
log in manually in headless mode.
