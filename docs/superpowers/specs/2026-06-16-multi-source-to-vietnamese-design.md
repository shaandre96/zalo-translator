# Zalo Translator — Multi-Source → Vietnamese

**Date:** 2026-06-16
**Status:** Approved for planning

## Summary

Pivot the extension from "Vietnamese → English" to "selected source languages →
Vietnamese." The user picks which source languages they expect to receive
(curated multi-select); incoming Zalo Web messages detected in any selected
language are translated to Vietnamese and shown below the message bubble.

Target language is **fixed to Vietnamese** — there is no target picker.

## Motivation

The current extension serves an English speaker reading a Vietnamese chat: it
detects Vietnamese text via a diacritics regex and translates it to English. The
new goal is the inverse and broader — a Vietnamese speaker reading messages that
arrive in a mix of foreign languages, all rendered into Vietnamese.

## Detection strategy

We cannot reliably know a message's language client-side before asking Google
(the existing diacritics regex only works because Vietnamese has distinctive
characters; it cannot distinguish, e.g., English from French).

**Chosen approach:** send each received message to Google with `sl=auto&tl=vi`.
Google returns both the Vietnamese translation and the detected source language
(`data[2]`). Inject the translation only if the detected language is in the
user's selected set. Cache results — including "skip" decisions — so identical
text is never re-requested.

Rejected alternatives:
- Pure client-side Unicode-script detection — fails for Latin-script languages
  (cannot tell English from French), which is exactly the use case.
- Translate every received message unconditionally — heaviest on Google's rate
  limit and shows translations the user did not ask for.

## Components

### 1. Settings model — `options.html` / `options.js`

- Replace the single source dropdown and the target dropdown with **5
  checkboxes**: English (`en`), Chinese Simplified (`zh-CN`), Korean (`ko`),
  Japanese (`ja`), Thai (`th`).
- No target picker — target is always Vietnamese (`vi`).
- Persist as `sourceLangs: string[]` in `chrome.storage.sync`, e.g.
  `["en","zh-CN","ko","ja","th"]`.
- **Default = all 5 checked.** Migration: if legacy `sourceLang` / `targetLang`
  keys exist in storage, **remove them** (`chrome.storage.sync.remove`) and seed
  the new default `sourceLangs`. No legacy keys are left behind.
- Save button persists `sourceLangs`; status message unchanged.

### 2. Translation request — `background.js`

- Always call Google with `sl=auto&tl=vi` (drop the stored `sourceLang` /
  `targetLang` lookup).
- Run the one-time legacy-key migration here on service-worker startup
  (`chrome.runtime.onInstalled`): if `sourceLang` / `targetLang` are present and
  `sourceLangs` is unset, seed `sourceLangs` to the default 5 and remove the two
  legacy keys.
- Continue returning `{ translation, detected }`. The `detected` value
  (`data[2]`) is the filter key used by the content script.
- Rate-limiting, queue, and backoff logic are unchanged.

### 3. Detection & injection — `content.js`

- Continue targeting **received messages only** via `RECV_SELECTOR`
  (`[data-id="div_ReceivedMsg_Text"]`).
- **Pre-skip:** if text matches the Vietnamese diacritics regex, skip — no point
  translating Vietnamese → Vietnamese, and it saves an API call.
- Send remaining text. On response, read `result.detected` and inject the
  translation **only if the detected language is in `sourceLangs`**.
- **Language normalization:** Google returns Chinese as `zh` (sometimes
  `zh-CN` / `zh-TW`). Normalize so any `zh*` detection matches the Chinese
  (`zh-CN`) checkbox. Apply the same base-code matching generally (compare on
  the part before `-`).
- **Cache:** store the detected language alongside the translation so a message
  whose language is not selected is remembered and never re-requested. Cache key
  remains the message text.
- Change the injected label from **"EN" → "VI"**.
- Load `sourceLangs` from storage on init; default to all 5 if unset.
- Live update: keep the existing `set-enabled` message flow for the on/off
  toggle. To pick up `sourceLangs` edits, the content script watches
  `chrome.storage.onChanged`; when `sourceLangs` changes it updates its in-memory
  set, removes existing translations, and re-scans so newly-eligible messages get
  translated and now-ineligible ones disappear.

### 4. Cosmetic / metadata

- `manifest.json` description → "Auto-translate incoming Zalo Web messages
  (English, Chinese, Korean, Japanese, Thai) into Vietnamese via Google
  Translate."
- `manifest.json` version → `1.1.0`.
- `popup.html` toggle label "Auto-translate Vietnamese" → "Auto-translate to
  Vietnamese".

## Data flow

1. Content script observes new received message bubbles.
2. Skip if empty or matches Vietnamese diacritics regex.
3. Check text cache; if present, use cached `{ translation, detected }`.
4. Otherwise send `{ type: "translate", text }` to background.
5. Background calls Google `sl=auto&tl=vi`, returns `{ translation, detected }`.
6. Content script caches the result, then injects only if normalized `detected`
   is in `sourceLangs`. Label = "VI".

## Error handling

- Network / rate-limit errors: unchanged — background applies backoff; content
  script injects the existing "Translation unavailable" error note.
- Empty translation: do not inject.

## Testing

- Vietnamese message → skipped (no request, no injection).
- English / Chinese / Korean / Japanese / Thai message → translated to
  Vietnamese, labeled "VI", when that language is checked.
- Message in a language **not** checked (e.g. German) → request made once,
  detected, not injected, and cached so it is not re-requested.
- Chinese detected as `zh` still matches the `zh-CN` checkbox.
- Unchecking a language and re-scanning stops new injections for it.
- Toggle off via popup removes all translations; toggle on re-scans.

## Out of scope

- Sent/outgoing messages (received only).
- The broader ~100-language list (curated 5 only).
- Per-message manual translate buttons.
- Keeping English (or any non-Vietnamese) as a target.
