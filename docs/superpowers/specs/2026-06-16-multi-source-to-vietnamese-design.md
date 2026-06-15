# Zalo Translator — Configurable Source/Target Translation

**Date:** 2026-06-16
**Status:** Approved for planning (revised)

## Summary

Make translation fully configurable: the user picks **multiple source
languages** (multi-select) and **one target language** (single-select). Incoming
Zalo Web messages whose detected language is in the selected source set — and is
not already the target language — are translated to the target language and shown
below the message bubble.

This supersedes the earlier "fixed Vietnamese target" design. It covers both
"Vietnamese → English" (the original v1.0 behavior) and "multiple languages →
Vietnamese," plus any other combination among the supported languages.

## Motivation

The original extension translated Vietnamese → English for an English speaker.
The first revision pivoted to many → Vietnamese, but that removed the VI→English
capability entirely. This design keeps both directions available by making source
and target user-configurable.

## Supported languages

Both the source multi-select and the target single-select offer the same six
languages:

| Code    | Name     | Native        |
|---------|----------|---------------|
| `vi`    | Vietnamese | Tiếng Việt  |
| `en`    | English  | English       |
| `zh-CN` | Chinese  | 中文 (简体)    |
| `ko`    | Korean   | 한국어        |
| `ja`    | Japanese | 日本語        |
| `th`    | Thai     | ไทย           |

## Configuration model

- `sourceLangs: string[]` — selected source languages (e.g. `["vi"]`).
- `targetLang: string` — the single target language (e.g. `"en"`).
- Both stored in `chrome.storage.sync`.
- **Defaults:** `sourceLangs = ["vi"]`, `targetLang = "en"` — restores the
  original Vietnamese → English behavior out of the box.

## Translate rule

A received message is translated and injected when:

1. its Google-detected language is in `sourceLangs` (base-code match, so `zh`,
   `zh-CN`, `zh-TW` all match a `zh-CN` selection), **and**
2. the detected language is **not** the target language (no same-language
   translation, e.g. English → English).

## Detection & request strategy

We cannot reliably detect a message's language client-side before sending it to
Google — **except Vietnamese**, via the existing diacritics heuristic
(`isLikelyVietnamese`). We use that to avoid wasted requests:

- **Vietnamese-looking message:** request a translation only if Vietnamese is a
  selected source **and** the target is not Vietnamese.
- **Any other message:** request a translation only if at least one
  non-Vietnamese source language is selected.

Consequences:
- Default **VI → EN** (`sourceLangs=["vi"]`, `targetLang="en"`): only
  Vietnamese-looking messages are sent — as lean as v1.0.
- **→ VI** modes (target `vi`, non-Vietnamese sources): Vietnamese messages are
  never sent; other messages are sent and filtered by detected language.

After a request returns, injection is still gated by the Translate rule above
(detected ∈ sources AND detected ≠ target), which also catches diacritics
false-positives.

## Components

### Shared utilities — `lang-utils.js`

Pure, dual-exported (CommonJS for tests, global `ZTLang` in the browser):

- `isLikelyVietnamese(text)` — diacritics heuristic (unchanged).
- `normalizeLang(code)` — lowercase + strip region (`zh-CN` → `zh`).
- `matchesSelected(detected, selected)` — base-code membership test.
- `shouldRequest(isViLikely, sources, target)` — the request strategy above.
  Returns false for empty/invalid `sources`.
- `shouldTranslate(detected, sources, target)` — `matchesSelected(detected,
  sources) && normalizeLang(detected) !== normalizeLang(target)`.
- `targetLabel(target)` — `normalizeLang(target).toUpperCase()` (e.g. `EN`,
  `VI`, `ZH`), used for the injected label.
- Constants: `DEFAULT_SOURCE_LANGS = ["vi"]`, `DEFAULT_TARGET_LANG = "en"`.

### Background — `background.js`

- `importScripts("lang-utils.js")` (first line).
- `translate(text)` reads `targetLang` from storage (default `"en"`) and requests
  `sl=auto&tl=<targetLang>`. Returns `{ translation, detected }`.
- `onInstalled` migration: if `sourceLangs` is not an array, seed
  `DEFAULT_SOURCE_LANGS`; if `targetLang` is not a string, seed
  `DEFAULT_TARGET_LANG`; remove the obsolete singular legacy key `sourceLang`
  (the current `targetLang` key is kept — an old v1.0 value carries over).
- Queue / rate-limit / backoff unchanged.

### Content script — `content.js`

- `STATE = { enabled, sourceLangs, targetLang }`, loaded on init from storage
  (defaulting to the constants).
- Process received messages only (`RECV_SELECTOR`).
- `process`: skip empty text; compute `isLikelyVietnamese`; skip unless
  `ZTLang.shouldRequest(isVi, sourceLangs, targetLang)`; request translation; on
  error inject the "Translation unavailable" note; otherwise inject only if
  `ZTLang.shouldTranslate(detected, sourceLangs, targetLang)`.
- `inject`: label = `ZTLang.targetLabel(STATE.targetLang)` (computed per call).
- Cache stores `{ translation, detected }` keyed by text.
- `chrome.storage.onChanged` (sync): on `sourceLangs` change, update state,
  remove translations, re-scan. On `targetLang` change, additionally **clear the
  cache** (cached translations target the old language), then remove + re-scan.

### Options — `options.html` / `options.js`

- **Source languages:** the grouped multi-select list, now six rows including
  Vietnamese (native names shown muted).
- **Target language:** a single `<select id="target">` with the six languages,
  reusing the existing `.zt-field select` styling.
- `options.js`: load `sourceLangs` (default `DEFAULT_SOURCE_LANGS`) and
  `targetLang` (default `DEFAULT_TARGET_LANG`); on Save, collect checked sources
  (block empty selection with a status message) and the selected target, store
  both.

### Manifest — `manifest.json`

- Description updated to reflect configurable translation.
- Version remains `1.1.0`; `lang-utils.js` already registered before
  `content.js`.

## Testing

- Pure logic (unit tests, `node:test`): `normalizeLang`, `matchesSelected`,
  `shouldRequest` (all four branches), `shouldTranslate` (incl. same-language
  skip), `targetLabel`, and the two default constants.
- Manual (in Chrome): default VI→EN translates Vietnamese to English and only
  sends Vietnamese-looking text; switching target to Vietnamese + selecting
  non-Vietnamese sources translates those into Vietnamese and skips Vietnamese;
  same-language is never injected; label matches the target; changing target
  re-translates existing messages into the new language; empty source selection
  is blocked; toggle on/off works; legacy `sourceLang` removed while `targetLang`
  is preserved.

## Out of scope

- Sent/outgoing messages (received only).
- Languages beyond the six listed; English regional variants in the target list.
- Per-message manual translate buttons.
