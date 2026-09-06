/**
 * me-lookup / lookup.js
 * -------------------------------------------------------------------------
 * Manual-assisted phone -> name lookup on Me Web (https://web.me.app).
 *
 * PRINCIPLES (do not remove):
 *   - Works ONLY through the real browser UI. No private/undocumented Me API.
 *   - Never tries to bypass CAPTCHA, rate limits, or any security mechanism.
 *   - Never asks for or stores your password. You log in manually, once.
 *   - Slow, human-like pace (2.5-4s between searches).
 *   - Stops and asks you to act when a CAPTCHA / block is detected.
 *
 * The browser opens VISIBLE (headless: false) and uses a persistent profile
 * (./me-profile) so you only log in once; the session is reused next time.
 *
 * Output:
 *   results.partial.json  -> written after every number (for resume)
 *   me_results.json       -> final structured results
 *   me_results.csv        -> final CSV with UTF-8 BOM (opens cleanly in Excel)
 * -------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

// ----------------------------- Configuration -----------------------------

const ROOT = __dirname;
const USER_DATA_DIR = path.join(ROOT, 'me-profile');
const PHONES_FILE = path.join(ROOT, 'phones.json');
const PARTIAL_FILE = path.join(ROOT, 'results.partial.json');
const JSON_OUT = path.join(ROOT, 'me_results.json');
const CSV_OUT = path.join(ROOT, 'me_results.csv');

const START_URL = 'https://web.me.app/';

// Timing (ms)
const RESULT_TIMEOUT = 10_000; // wait per search attempt for a result
const SEARCH_ATTEMPTS = 2; // 1 try + 1 retry
const DELAY_MIN = 2_500;
const DELAY_MAX = 4_000;

// HEADLESS=1 forces headless (useful only for a dry smoke-test; you cannot
// log in manually in headless mode). Default is a visible window.
const HEADLESS = process.env.HEADLESS === '1';

// Optional: point Playwright at a specific Chromium binary. Normally leave
// unset (Playwright uses the browser installed by `npx playwright install
// chromium`). Only needed if that download is unavailable and you already
// have a compatible Chromium on disk.
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || undefined;

// ------------------------------- Utilities -------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randDelay = () =>
  Math.floor(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));

/** Keep digits only (so "054-309-0304" == "0543090304"). */
function digitsOnly(s) {
  return String(s == null ? '' : s).replace(/\D/g, '');
}

/**
 * Significant national suffix used for matching. Israeli mobile numbers are
 * 10 digits starting with 0; internationally shown as +972 and the leading 0
 * dropped. Comparing the last 9 digits makes both forms match.
 */
function significant(s) {
  const d = digitsOnly(s);
  return d.length >= 9 ? d.slice(-9) : d;
}

function log(...args) {
  console.log(...args);
}

/** Prompt on the terminal and resolve when the user presses Enter. */
function waitForEnter(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`\n${message}\n> Press Enter to continue... `, () => {
      rl.close();
      resolve();
    });
  });
}

// --------------------------- Load / save state ---------------------------

function loadPhones() {
  const raw = JSON.parse(fs.readFileSync(PHONES_FILE, 'utf8'));
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('phones.json must be a non-empty JSON array of strings.');
  }
  return raw.map((p) => String(p).trim());
}

function loadPartial() {
  if (!fs.existsSync(PARTIAL_FILE)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(PARTIAL_FILE, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    log('! results.partial.json is unreadable; starting fresh.');
    return [];
  }
}

function savePartial(results) {
  const tmp = PARTIAL_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(results, null, 2), 'utf8');
  fs.renameSync(tmp, PARTIAL_FILE); // atomic-ish, avoids corrupt partial file
}

function csvEscape(value) {
  const s = String(value == null ? '' : value);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function writeFinal(results) {
  // JSON
  fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2), 'utf8');

  // CSV with UTF-8 BOM so Hebrew opens correctly in Excel
  const header = ['index', 'phone', 'name', 'status'];
  const lines = [header.join(',')];
  for (const r of results) {
    lines.push(
      [r.index, r.phone, r.name, r.status].map(csvEscape).join(',')
    );
  }
  const csv = '﻿' + lines.join('\r\n') + '\r\n';
  fs.writeFileSync(CSV_OUT, csv, 'utf8');
}

// ------------------------------ Page helpers -----------------------------

/**
 * Find the search input, most-stable strategy first:
 *   1. placeholder contains "phone" (case-insensitive)
 *   2. any input[type=text] / [type=search] / [type=tel]
 *   3. contenteditable / role=textbox
 * Returns a Playwright Locator or null.
 */
async function findSearchInput(page) {
  const candidates = [
    page.locator('input[placeholder*="phone" i]'),
    page.locator('input[placeholder*="search" i]'),
    page.locator('input[placeholder*="חיפוש" i]'),
    page.locator('input[placeholder*="טלפון" i]'),
    page.locator('input[type="search"]'),
    page.locator('input[type="tel"]'),
    page.getByRole('textbox'),
    page.locator('input[type="text"]'),
    page.locator('[contenteditable="true"]'),
  ];
  for (const loc of candidates) {
    try {
      const first = loc.first();
      if ((await first.count()) > 0 && (await first.isVisible())) {
        return first;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Heuristic: does the page currently show a CAPTCHA / robot check? */
async function detectCaptcha(page) {
  try {
    const frameHit = await page
      .locator(
        'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[title*="captcha" i], iframe[src*="captcha"]'
      )
      .count();
    if (frameHit > 0) return true;

    const textHit = await page
      .locator(
        ':is(div,section,main,h1,h2,p,span):has-text("captcha"), ' +
          ':is(div,section,main,h1,h2,p,span):has-text("not a robot"), ' +
          ':is(div,section,main,h1,h2,p,span):has-text("אימות")'
      )
      .count()
      .catch(() => 0);
    return textHit > 0;
  } catch {
    return false;
  }
}

/**
 * Extract the contact name shown for `phone`, evaluated in the page DOM.
 * Strategy (no reliance on random class names):
 *   - Find visible elements whose digits contain the number's 9-digit suffix.
 *   - Walk up to a reasonable "card" ancestor.
 *   - Read the card's visible text lines; drop phone-like / label lines;
 *     the first remaining human-looking line is the name.
 * Returns { found, name, debug }.
 */
async function extractName(page, phone) {
  const target = significant(phone);
  return page.evaluate((sig) => {
    const onlyDigits = (s) => (s || '').replace(/\D/g, '');
    const sigOf = (s) => {
      const d = onlyDigits(s);
      return d.length >= 9 ? d.slice(-9) : d;
    };

    const isVisible = (el) => {
      if (!el || !el.getClientRects || el.getClientRects().length === 0)
        return false;
      const st = window.getComputedStyle(el);
      return st.visibility !== 'hidden' && st.display !== 'none';
    };

    // Candidate nodes: leaf-ish elements whose OWN text carries the number.
    const all = Array.from(document.querySelectorAll('body *'));
    const matches = [];
    for (const el of all) {
      if (!isVisible(el)) continue;
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length > 400) continue;
      if (sigOf(txt) === sig || onlyDigits(txt).includes(sig)) {
        matches.push(el);
      }
    }
    if (matches.length === 0) return { found: false, name: '', debug: [] };

    // Prefer the deepest (most specific) match as the phone node.
    matches.sort((a, b) => b.querySelectorAll('*').length - a.querySelectorAll('*').length);
    const phoneNode = matches[matches.length - 1];

    // Walk up to a card container (a clickable/list-ish ancestor).
    let card = phoneNode;
    for (let i = 0; i < 5 && card.parentElement; i++) {
      const p = card.parentElement;
      if (p === document.body) break;
      card = p;
      const role = (card.getAttribute('role') || '').toLowerCase();
      if (
        card.tagName === 'LI' ||
        card.tagName === 'A' ||
        card.tagName === 'BUTTON' ||
        role === 'listitem' ||
        role === 'button' ||
        role === 'option'
      ) {
        break;
      }
    }

    // Collect text fragments within the card. We take each element's OWN
    // direct text (its text nodes, not its descendants'), so a name and a
    // number in adjacent inline <span>s stay on separate lines even when
    // innerText would glue them together.
    const directText = (el) => {
      let t = '';
      for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
      return t.trim();
    };
    const frags = [];
    const pushFrag = (s) => {
      const v = (s || '').trim();
      if (v) frags.push(v);
    };
    pushFrag(directText(card));
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_ELEMENT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) pushFrag(directText(n));
    // Fallback to innerText line-split if the card had no element-level text.
    if (frags.length === 0) {
      for (const l of (card.innerText || card.textContent || '').split('\n')) {
        pushFrag(l);
      }
    }
    // De-duplicate, preserving order.
    const seen = new Set();
    const rawLines = [];
    for (const f of frags) {
      if (!seen.has(f)) {
        seen.add(f);
        rawLines.push(f);
      }
    }

    const labelWords = [
      'phone',
      'search',
      'number',
      'call',
      'save',
      'spam',
      'טלפון',
      'חיפוש',
      'מספר',
      'שיחה',
    ];
    const looksLikeLabel = (line) => {
      const low = line.toLowerCase();
      return labelWords.some((w) => low === w || low.includes(w));
    };
    const looksLikePhone = (line) => {
      const d = onlyDigits(line);
      // mostly digits, or contains our number
      return d.length >= 7 && d.length / line.replace(/\s/g, '').length > 0.5;
    };

    const debug = rawLines.slice(0, 8);
    for (const line of rawLines) {
      if (looksLikePhone(line)) continue;
      if (looksLikeLabel(line)) continue;
      if (onlyDigits(line).includes(sig)) continue;
      if (line.length < 2) continue;
      return { found: true, name: line, debug };
    }
    // Fallback: number was found but no clean name line.
    return { found: true, name: '', debug };
  }, target);
}

/** Clear the input and type the phone (React/debounce friendly). */
async function typePhone(input, phone) {
  await input.click();
  // Clear any existing value robustly.
  try {
    await input.fill('');
  } catch {
    await input.press('Control+A').catch(() => {});
    await input.press('Delete').catch(() => {});
  }
  // Try fill first; if the framework ignores it, type char-by-char.
  await input.fill(phone).catch(() => {});
  let val = '';
  try {
    val = (await input.inputValue()) || '';
  } catch {
    val = '';
  }
  if (digitsOnly(val) !== digitsOnly(phone)) {
    await input.fill('').catch(() => {});
    await input.pressSequentially(phone, { delay: 60 });
  }
}

/**
 * Run one search for `phone` and return { name, status }.
 * status: 'found' | 'not_found' | 'error'
 */
async function searchOne(page, phone) {
  for (let attempt = 1; attempt <= SEARCH_ATTEMPTS; attempt++) {
    try {
      if (await detectCaptcha(page)) {
        await waitForEnter(
          'CAPTCHA detected. Solve it manually and press Enter to continue.'
        );
      }

      const input = await findSearchInput(page);
      if (!input) {
        throw new Error('Search input not found on the page.');
      }

      await typePhone(input, phone);
      // Some UIs need Enter to trigger the search; harmless if not.
      await input.press('Enter').catch(() => {});

      // Poll for a result up to RESULT_TIMEOUT.
      const deadline = Date.now() + RESULT_TIMEOUT;
      let result = { found: false, name: '', debug: [] };
      while (Date.now() < deadline) {
        if (await detectCaptcha(page)) {
          await waitForEnter(
            'CAPTCHA detected. Solve it manually and press Enter to continue.'
          );
        }
        result = await extractName(page, phone);
        if (result.found) break;
        await sleep(500);
      }

      if (result.found) {
        return { name: result.name || 'לא נמצא', status: result.name ? 'found' : 'not_found' };
      }

      if (attempt < SEARCH_ATTEMPTS) {
        log(`   ...no result yet, retry ${attempt + 1}/${SEARCH_ATTEMPTS}`);
        await sleep(1_000);
        continue;
      }
      return { name: 'לא נמצא', status: 'not_found' };
    } catch (err) {
      log(`   ! error: ${err.message}`);
      if (attempt < SEARCH_ATTEMPTS) {
        await sleep(1_000);
        continue;
      }
      return { name: 'שגיאה', status: 'error' };
    }
  }
  return { name: 'שגיאה', status: 'error' };
}

// --------------------------------- Main ----------------------------------

async function main() {
  const phones = loadPhones();
  const results = loadPartial();

  // Index completed phones (by normalized digits) so resume skips them.
  const done = new Map();
  for (const r of results) done.set(digitsOnly(r.phone), r);

  log(`Loaded ${phones.length} phone numbers.`);
  if (done.size > 0) {
    log(`Resuming: ${done.size} already completed, will skip those.`);
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: HEADLESS,
    viewport: { width: 1280, height: 900 },
    executablePath: CHROMIUM_PATH,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  // Reuse an existing tab if present, else open one.
  const page = context.pages()[0] || (await context.newPage());

  log(`Opening ${START_URL} ...`);
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' }).catch((e) => {
    log(`! navigation warning: ${e.message}`);
  });

  // Give the SPA a moment to render.
  await sleep(3_000);

  // Login gate: if we can't find the search input, ask the user to log in.
  let input = await findSearchInput(page);
  if (!input) {
    await waitForEnter(
      'Please login to Me Web manually. When ready, press Enter in terminal.'
    );
    // Re-check after manual login; poll a bit for the SPA to settle.
    for (let i = 0; i < 20 && !input; i++) {
      input = await findSearchInput(page);
      if (input) break;
      await sleep(1_000);
    }
    if (!input) {
      log(
        '\nERROR: Still could not find the search input after login.\n' +
          'Open DevTools on the Me Web page, inspect the search field, and\n' +
          'adjust findSearchInput() in lookup.js with the correct selector.\n'
      );
      await context.close();
      process.exit(1);
    }
  }

  log('Search field located. Starting lookups.\n');

  // Save partial on Ctrl+C.
  let interrupted = false;
  process.on('SIGINT', () => {
    if (interrupted) process.exit(1);
    interrupted = true;
    log('\n^C received - saving partial results and exiting...');
    try {
      savePartial(results);
    } catch {}
    process.exit(0);
  });

  for (let i = 0; i < phones.length; i++) {
    const index = i + 1;
    const phone = phones[i];

    if (done.has(digitsOnly(phone))) {
      const prev = done.get(digitsOnly(phone));
      log(`[${index}/${phones.length}] Skipping ${phone} (done: ${prev.status})`);
      continue;
    }

    log(`[${index}/${phones.length}] Searching ${phone}`);
    const { name, status } = await searchOne(page, phone);

    if (status === 'found') log(`   Found: ${name}`);
    else if (status === 'not_found') log('   Found: לא נמצא');
    else log('   Found: שגיאה');

    const record = { index, phone, name, status };
    results.push(record);
    done.set(digitsOnly(phone), record);
    savePartial(results);

    if (i < phones.length - 1) {
      await sleep(randDelay());
    }
  }

  // Reorder results to match the original phone order before final export.
  const byPhone = new Map(results.map((r) => [digitsOnly(r.phone), r]));
  const ordered = phones.map((phone, i) => {
    const r = byPhone.get(digitsOnly(phone)) || {
      index: i + 1,
      phone,
      name: 'שגיאה',
      status: 'error',
    };
    return { ...r, index: i + 1, phone };
  });

  writeFinal(ordered);
  log(`\nDone. Wrote:\n  ${CSV_OUT}\n  ${JSON_OUT}`);

  const summary = ordered.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  log(`Summary: ${JSON.stringify(summary)}`);

  await context.close();
}

// Run only when invoked directly; when required (e.g. by tests) just export.
if (require.main === module) {
  main().catch((err) => {
    console.error('\nFATAL:', err);
    process.exit(1);
  });
}

module.exports = {
  digitsOnly,
  significant,
  csvEscape,
  extractName,
  findSearchInput,
  detectCaptcha,
};
