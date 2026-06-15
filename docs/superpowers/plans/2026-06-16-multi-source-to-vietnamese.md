# Multi-Source → Vietnamese Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Zalo Translator extension from "Vietnamese → English" into "selected source languages → Vietnamese," with a curated multi-select of source languages.

**Architecture:** Pure language matching/normalization logic is extracted into a shared, unit-tested `lang-utils.js` used by both the content script and the background service worker. Received messages are sent to Google with `sl=auto&tl=vi`; the returned detected language is matched against the user's selected set, and the Vietnamese translation is injected only on a match.

**Tech Stack:** Vanilla JS, Chrome Extension Manifest V3, Google Translate public endpoint, Node.js built-in test runner (`node:test`) for unit tests.

**Spec:** `docs/superpowers/specs/2026-06-16-multi-source-to-vietnamese-design.md`

---

## File Structure

- **Create** `lang-utils.js` — pure helpers: `isLikelyVietnamese`, `normalizeLang`, `matchesSelected`, and the `DEFAULT_SOURCE_LANGS` constant. Dual-exported (CommonJS for tests, global `ZTLang` for the browser).
- **Create** `package.json` — test script only.
- **Create** `test/lang-utils.test.js` — unit tests for `lang-utils.js`.
- **Modify** `content.js` — use `ZTLang` helpers; label "VI"; filter by detected language; cache detected; live-update on storage change.
- **Modify** `background.js` — `importScripts` the utils; always request `sl=auto&tl=vi`; one-time legacy-key migration on install.
- **Modify** `options.html` / `options.js` — replace dropdowns with 5 checkboxes; persist `sourceLangs`.
- **Modify** `popup.html` — toggle label wording.
- **Modify** `manifest.json` — register `lang-utils.js` as a content script (before `content.js`); update description; bump version to `1.1.0`.

---

### Task 1: Shared language utilities (`lang-utils.js`) with unit tests

**Files:**
- Create: `package.json`
- Create: `test/lang-utils.test.js`
- Create: `lang-utils.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "zalo-translator",
  "version": "1.1.0",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `test/lang-utils.test.js`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isLikelyVietnamese, normalizeLang, matchesSelected, DEFAULT_SOURCE_LANGS } =
  require("../lang-utils.js");

test("isLikelyVietnamese: detects Vietnamese diacritics", () => {
  assert.equal(isLikelyVietnamese("Chào bạn"), true);
  assert.equal(isLikelyVietnamese("Cảm ơn nhiều"), true);
});

test("isLikelyVietnamese: false for non-Vietnamese / empty / 1-char", () => {
  assert.equal(isLikelyVietnamese("Hello there"), false);
  assert.equal(isLikelyVietnamese("안녕하세요"), false);
  assert.equal(isLikelyVietnamese(""), false);
  assert.equal(isLikelyVietnamese("a"), false);
  assert.equal(isLikelyVietnamese(null), false);
});

test("normalizeLang: lowercases and strips region", () => {
  assert.equal(normalizeLang("zh-CN"), "zh");
  assert.equal(normalizeLang("zh-TW"), "zh");
  assert.equal(normalizeLang("EN"), "en");
  assert.equal(normalizeLang("en-US"), "en");
  assert.equal(normalizeLang(""), "");
  assert.equal(normalizeLang(null), "");
});

test("matchesSelected: base-code matching incl. Chinese variants", () => {
  const selected = ["en", "zh-CN", "ko", "ja", "th"];
  assert.equal(matchesSelected("en", selected), true);
  assert.equal(matchesSelected("zh", selected), true); // Google returns bare "zh"
  assert.equal(matchesSelected("zh-TW", selected), true);
  assert.equal(matchesSelected("ko", selected), true);
  assert.equal(matchesSelected("de", selected), false);
  assert.equal(matchesSelected("vi", selected), false);
});

test("matchesSelected: defensive against bad input", () => {
  assert.equal(matchesSelected("", ["en"]), false);
  assert.equal(matchesSelected("en", null), false);
  assert.equal(matchesSelected("en", []), false);
});

test("DEFAULT_SOURCE_LANGS: the curated five", () => {
  assert.deepEqual(DEFAULT_SOURCE_LANGS, ["en", "zh-CN", "ko", "ja", "th"]);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test test/lang-utils.test.js`
Expected: FAIL — `Cannot find module '../lang-utils.js'`.

- [ ] **Step 4: Implement `lang-utils.js`**

Create `lang-utils.js`:

```js
(function (root) {
  const VI_DIACRITICS =
    /[àáảãạâấầẩẫậăắằẳẵặèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;

  function isLikelyVietnamese(text) {
    return !!text && text.length >= 2 && VI_DIACRITICS.test(text);
  }

  function normalizeLang(code) {
    if (!code) return "";
    return String(code).toLowerCase().split("-")[0];
  }

  function matchesSelected(detected, selected) {
    if (!detected || !Array.isArray(selected)) return false;
    const base = normalizeLang(detected);
    return selected.some((s) => normalizeLang(s) === base);
  }

  const DEFAULT_SOURCE_LANGS = ["en", "zh-CN", "ko", "ja", "th"];

  const api = { isLikelyVietnamese, normalizeLang, matchesSelected, DEFAULT_SOURCE_LANGS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.ZTLang = api;
  }
})(typeof self !== "undefined" ? self : this);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test test/lang-utils.test.js`
Expected: PASS — all 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json test/lang-utils.test.js lang-utils.js
git commit -m "feat: add shared language utils with unit tests"
```

---

### Task 2: Background — auto-detect translation + legacy migration

**Files:**
- Modify: `background.js`

- [ ] **Step 1: Load shared utils at the top of `background.js`**

Add as the very first line of `background.js` (before `const GOOGLE_URL`):

```js
importScripts("lang-utils.js");
```

- [ ] **Step 2: Switch `translate()` to auto-detect → Vietnamese**

In `background.js`, replace the entire `async function translate(text) { ... }` body's top (the storage lookup and URL build) so the function reads:

```js
async function translate(text) {
  const url =
    `${GOOGLE_URL}?client=gtx` +
    `&sl=auto` +
    `&tl=vi` +
    `&dt=t`;

  const body = `q=${encodeURIComponent(text)}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    return { error: formatFetchError(err) };
  }

  if (!res.ok) {
    if (res.status === 429) {
      return { error: "Google rate-limited this IP. Wait a minute and retry." };
    }
    const errText = await res.text();
    return { error: `Google ${res.status}: ${errText.slice(0, 200)}` };
  }

  const data = await res.json();
  const segments = Array.isArray(data?.[0]) ? data[0] : [];
  const translation = segments
    .map((seg) => (Array.isArray(seg) ? seg[0] : ""))
    .filter(Boolean)
    .join("");
  const detected = data?.[2] || "";

  return { translation, detected };
}
```

(The previous version started with a `chrome.storage.sync.get(["sourceLang","targetLang"])` and used `sl=${sourceLang}&tl=${targetLang}`, and defaulted `detected` to `sourceLang`. Both are gone.)

- [ ] **Step 3: Add the one-time legacy-key migration**

Add this block to `background.js` immediately after the `importScripts(...)` line (top of file):

```js
chrome.runtime.onInstalled.addListener(async () => {
  const { sourceLangs, sourceLang, targetLang } = await chrome.storage.sync.get([
    "sourceLangs",
    "sourceLang",
    "targetLang",
  ]);
  if (!Array.isArray(sourceLangs)) {
    await chrome.storage.sync.set({ sourceLangs: ZTLang.DEFAULT_SOURCE_LANGS.slice() });
  }
  if (sourceLang !== undefined || targetLang !== undefined) {
    await chrome.storage.sync.remove(["sourceLang", "targetLang"]);
  }
});
```

- [ ] **Step 4: Manually verify (deferred to Task 6 load test)**

There is no automated harness for the service worker. This task is verified together with the full extension load in Task 6. For now, confirm the file has no syntax errors:

Run: `node --check background.js`
Expected: no output (exit 0). Note: this only checks syntax — `importScripts`/`chrome` are undefined under Node, which is fine because `--check` does not execute the file.

- [ ] **Step 5: Commit**

```bash
git add background.js
git commit -m "feat: background translates any source to Vietnamese + migrate legacy keys"
```

---

### Task 3: Content script — filter by detected language, label "VI", live update

**Files:**
- Modify: `content.js`

- [ ] **Step 1: Replace the full contents of `content.js`**

Replace the entire file with:

```js
(() => {
  const DEFAULTS = ZTLang.DEFAULT_SOURCE_LANGS;
  const STATE = { enabled: true, sourceLangs: DEFAULTS.slice() };
  const CACHE = new Map(); // text -> { translation, detected }
  const INFLIGHT = new Map();

  const RECV_SELECTOR = '[data-id="div_ReceivedMsg_Text"]';

  function getTranslation(text) {
    if (CACHE.has(text)) return Promise.resolve(CACHE.get(text));
    if (INFLIGHT.has(text)) return INFLIGHT.get(text);

    const p = chrome.runtime
      .sendMessage({ type: "translate", text })
      .then((res) => {
        INFLIGHT.delete(text);
        if (res?.error) {
          console.warn("[zalo-translator]", res.error);
          return { error: res.error };
        }
        const result = {
          translation: res?.translation || "",
          detected: res?.detected || "",
        };
        if (result.translation) CACHE.set(text, result);
        return result;
      })
      .catch((err) => {
        INFLIGHT.delete(text);
        const message = err?.message || String(err);
        console.warn("[zalo-translator]", message);
        return { error: message };
      });

    INFLIGHT.set(text, p);
    return p;
  }

  function inject(bubble, translation, isError = false) {
    if (bubble.nextElementSibling?.classList?.contains("zt-translation")) return;
    if (!bubble.parentNode) return;
    const div = document.createElement("div");
    div.className = "zt-translation" + (isError ? " zt-translation--err" : "");
    div.innerHTML = '<span class="zt-label">VI</span> <span class="zt-body"></span>';
    div.querySelector(".zt-body").textContent = translation;
    bubble.parentNode.insertBefore(div, bubble.nextSibling);
  }

  async function process(bubble) {
    if (!STATE.enabled) return;
    if (bubble.nextElementSibling?.classList?.contains("zt-translation")) return;
    const text = (bubble.innerText || "").trim();
    if (!text || ZTLang.isLikelyVietnamese(text)) return;
    const result = await getTranslation(text);
    if (result?.error) {
      inject(bubble, "Translation unavailable — try again shortly.", true);
      return;
    }
    if (result?.translation && ZTLang.matchesSelected(result.detected, STATE.sourceLangs)) {
      inject(bubble, result.translation);
    }
  }

  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches?.(RECV_SELECTOR)) process(root);
    root.querySelectorAll?.(RECV_SELECTOR).forEach(process);
  }

  function removeAllTranslations() {
    document.querySelectorAll(".zt-translation").forEach((el) => el.remove());
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) scan(node);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  scan(document.body);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "set-enabled") {
      STATE.enabled = !!msg.enabled;
      if (!STATE.enabled) removeAllTranslations();
      else scan(document.body);
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.sourceLangs) {
      STATE.sourceLangs = Array.isArray(changes.sourceLangs.newValue)
        ? changes.sourceLangs.newValue
        : DEFAULTS.slice();
      removeAllTranslations();
      if (STATE.enabled) scan(document.body);
    }
  });

  chrome.storage.sync.get(["enabled", "sourceLangs"]).then(({ enabled, sourceLangs }) => {
    STATE.enabled = enabled !== false;
    if (Array.isArray(sourceLangs)) STATE.sourceLangs = sourceLangs;
    if (STATE.enabled) scan(document.body);
  });
})();
```

Key changes vs. the original: removed the inline `VI_DIACRITICS`/`isLikelyVietnamese` (now in `ZTLang`); cache stores `{translation, detected}`; `process` pre-skips Vietnamese, surfaces errors, and injects only when the detected language is selected; label is "VI"; `sourceLangs` is loaded on init and kept live via `chrome.storage.onChanged`. Note: when `sourceLangs` changes, existing translations are cleared and a re-scan re-evaluates from cache (no re-fetch needed — matching is recomputed against `STATE.sourceLangs`).

- [ ] **Step 2: Verify syntax**

Run: `node --check content.js`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "feat: content script filters by detected language, labels VI"
```

---

### Task 4: Manifest — register utils content script, description, version

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: Add `lang-utils.js` to the content script `js` array (before `content.js`)**

In `manifest.json`, change the `content_scripts[0].js` entry from:

```json
			"js": ["content.js"],
```

to:

```json
			"js": ["lang-utils.js", "content.js"],
```

(`lang-utils.js` must come first so the global `ZTLang` exists before `content.js` runs.)

- [ ] **Step 2: Update the description and version**

In `manifest.json`, change:

```json
	"version": "1.0.0",
	"description": "Auto-translate incoming Vietnamese Zalo Web messages to English via Google Translate.",
```

to:

```json
	"version": "1.1.0",
	"description": "Auto-translate incoming Zalo Web messages (English, Chinese, Korean, Japanese, Thai) into Vietnamese via Google Translate.",
```

- [ ] **Step 3: Verify the manifest is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add manifest.json
git commit -m "chore: register lang-utils content script, update manifest to v1.1.0"
```

---

### Task 5: Options page — language checkboxes

**Files:**
- Modify: `options.html`
- Modify: `options.js`

- [ ] **Step 1: Replace the two `.zt-field` blocks in `options.html`**

In `options.html`, replace both the "Source language" and "Target language" `<div class="zt-field">` blocks (the `<select id="source">` and `<select id="target">` fields) with a single checkbox group. Also add the `lang-utils.js` script before `options.js`.

Replace:

```html
          <div class="zt-field">
            <label for="source">Source language</label>
            <select id="source">
              <option value="vi">Vietnamese (best for Zalo)</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>

          <div class="zt-field">
            <label for="target">Target language</label>
            <select id="target">
              <option value="en">English</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </div>
```

with:

```html
          <div class="zt-field">
            <label>Translate these languages to Vietnamese</label>
            <div id="langs">
              <label class="zt-check-row">
                <input type="checkbox" value="en" />
                <span class="zt-check-box" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.2 5.8 10.5 11.5 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                English
              </label>
              <label class="zt-check-row">
                <input type="checkbox" value="zh-CN" />
                <span class="zt-check-box" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.2 5.8 10.5 11.5 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                Chinese (Simplified)
              </label>
              <label class="zt-check-row">
                <input type="checkbox" value="ko" />
                <span class="zt-check-box" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.2 5.8 10.5 11.5 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                Korean
              </label>
              <label class="zt-check-row">
                <input type="checkbox" value="ja" />
                <span class="zt-check-box" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.2 5.8 10.5 11.5 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                Japanese
              </label>
              <label class="zt-check-row">
                <input type="checkbox" value="th" />
                <span class="zt-check-box" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.2 5.8 10.5 11.5 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                Thai
              </label>
            </div>
          </div>
```

- [ ] **Step 2: Add the utils script tag in `options.html`**

In `options.html`, change:

```html
    <script src="options.js"></script>
```

to:

```html
    <script src="lang-utils.js"></script>
    <script src="options.js"></script>
```

- [ ] **Step 3: Replace the contents of `options.js`**

Replace the entire file with:

```js
const langsEl = document.getElementById("langs");
const statusEl = document.getElementById("status");
const boxes = () => Array.from(langsEl.querySelectorAll('input[type="checkbox"]'));

chrome.storage.sync.get(["sourceLangs"]).then(({ sourceLangs }) => {
  const selected = Array.isArray(sourceLangs) ? sourceLangs : ZTLang.DEFAULT_SOURCE_LANGS;
  boxes().forEach((cb) => {
    cb.checked = selected.includes(cb.value);
  });
});

document.getElementById("save").addEventListener("click", async () => {
  const sourceLangs = boxes()
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  await chrome.storage.sync.set({ sourceLangs });
  statusEl.textContent = "Saved.";
  setTimeout(() => (statusEl.textContent = ""), 2000);
});
```

- [ ] **Step 4: Verify syntax / HTML validity**

Run: `node --check options.js`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add options.html options.js
git commit -m "feat: options page picks source languages via checkboxes"
```

---

### Task 6: Popup wording + full extension load test

**Files:**
- Modify: `popup.html`

- [ ] **Step 1: Update the toggle label in `popup.html`**

In `popup.html`, change:

```html
          Auto-translate Vietnamese
```

to:

```html
          Auto-translate to Vietnamese
```

- [ ] **Step 2: Commit the wording change**

```bash
git add popup.html
git commit -m "chore: update popup toggle label to 'Auto-translate to Vietnamese'"
```

- [ ] **Step 3: Run the unit tests once more**

Run: `npm test`
Expected: all tests in `test/lang-utils.test.js` PASS.

- [ ] **Step 4: Manual load test in Chrome**

1. Open `chrome://extensions`, enable Developer mode, "Load unpacked" → select the project folder. Confirm it loads with **no errors** and shows version **1.1.0**.
2. Open the service worker console (Inspect views → service worker). Confirm no errors on load.
3. Open `https://chat.zalo.me/` and a conversation.
4. Verify each item from the spec's Testing section:
   - A Vietnamese received message → **not** translated (no request fired — check Network tab).
   - An English / Chinese / Korean / Japanese / Thai received message → a **"VI"** translation appears below it.
   - A message in a language **not** checked (e.g. German) → no translation appears; the request fires once and the result is cached (no repeat request for identical text).
   - A Chinese message detected by Google as `zh` still gets translated (matches the `zh-CN` checkbox).
   - In Options, uncheck a language and Save → existing translations clear and that language stops being translated **without reloading the page** (verifies the `storage.onChanged` path).
   - Toggle off in the popup → all translations disappear; toggle on → they reappear.
5. Confirm legacy migration: in the service worker console run
   `chrome.storage.sync.get(["sourceLang","targetLang","sourceLangs"]).then(console.log)`
   → `sourceLang`/`targetLang` are absent (`undefined`) and `sourceLangs` is an array.

- [ ] **Step 5: Final commit (if any manual-test fixes were needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual load test"
```

(Skip this commit if the manual test passed with no changes.)

---

## Notes for the implementer

- `lang-utils.js` uses a dual-export shim: `module.exports` under Node (for tests), global `ZTLang` in the browser. Do not convert it to an ES module — Manifest V3 classic content scripts and `importScripts` both need the classic-script/global form.
- Load order matters: `lang-utils.js` must be listed before `content.js` in the manifest, and its `<script>` tag must precede `options.js` in `options.html`. In `background.js`, `importScripts("lang-utils.js")` must be the first line.
- Matching is recomputed from `STATE.sourceLangs` at injection time, so changing the selected languages does not require clearing the translation cache or re-calling Google — only removing rendered translations and re-scanning.
- Only **received** messages are processed (`RECV_SELECTOR`), unchanged from the original.
