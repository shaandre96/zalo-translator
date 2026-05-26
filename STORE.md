# Chrome Web Store checklist

Use this when filling the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Privacy policy URL

After enabling GitHub Pages (see README), use:

**https://shaandre96.github.io/zalo-translator/**

Chrome requires a normal `https://` page—not a raw GitHub file link.

## Enable GitHub Pages (one time)

1. Push `docs/index.html` to `main` on GitHub.
2. Repo → **Settings** → **Pages**.
3. **Build and deployment** → Source: **Deploy from a branch**.
4. Branch: **main**, folder: **/docs**, Save.
5. Wait 1–2 minutes. Open the URL above (404 at first is normal until deploy finishes).

`PRIVACY.md` in the repo root is for humans reading on GitHub; the store listing should use the Pages URL.

## Icon (128 / 48 / 16)

The Web Store and `manifest.json` need PNG icons. Suggested prompt for any image AI:

> Simple flat app icon for a Chrome extension: rounded square, blue #0068FF background, white letters "VI→EN" or a speech bubble with a small "EN" badge, minimal, no text besides EN/VI, no Zalo logo, professional, 512x512

**Tools that work well**

| Tool | Notes |
|------|--------|
| **ChatGPT** (DALL·E) / **Gemini** | Paste the prompt; export PNG; resize to 128×128 |
| **Canva** | Free “App icon” template; export PNG |
| **Figma** | Full control; export @1x and @2x |
| **Cursor / this chat** | Ask: “Generate a 512×512 extension icon…” and attach to the repo |
| **Recraft / Ideogram** | Good for flat icons |

Then resize (macOS Preview → Tools → Adjust Size, or [squoosh.app](https://squoosh.app)) to **128**, **48**, and **16** px. Save as `icons/icon128.png`, `icon48.png`, `icon16.png` and add to `manifest.json`:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
},
"action": {
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png"
  }
}
```

Do **not** use Zalo’s official logo—you don’t have trademark rights.

## Screenshots

You need **at least one** image; up to five helps conversion.

### Easy option: local demo (no Google API)

Open `screenshots/demo.html` in Chrome (File → Open, or drag into a tab). Resize to **1280×800**, hide the yellow hint bar if you want (delete that `<p>` temporarily), capture. The blue **EN** strips use the same CSS as the real extension.

### DALL·E prompts (promo / marquee only)

Chrome wants screenshots that **match what users get**. Use AI art for optional marketing tiles, not as a substitute for showing the real **EN** overlay unless you label it clearly as illustrative.

**Hero — chat with translations (illustrative UI, not Zalo logo):**

```
Wide 16:10 product screenshot mockup of a modern chat web app (generic, not Zalo branding). Light gray background, white message bubbles on the left. Two Vietnamese messages in bubbles, each with a second line below: a blue left-bordered pill labeled "EN" with English translation text. Clean minimal UI like Facebook Messenger. No logos, no real brand names. Soft shadows, 1280x800 composition, UI design only, flat style.
```

**Feature — extension popup:**

```
Chrome browser extension popup panel, 220px wide, white card titled "Zalo Translator", checkbox labeled "Auto-translate Vietnamese" checked, link "Settings", subtle footer text "Google Translate". Blue accent #0068FF. Minimal macOS-style UI mockup, no browser chrome, product illustration, 640x400.
```

**Marquee / small promo tile (1280×800 or 440×280):**

```
Minimal promotional banner for a browser extension: speech bubbles, Vietnamese text fading into English, blue #0068FF accent, text "Vietnamese → English for Zalo Web", flat vector, no third-party logos, lots of whitespace, professional app store style.
```

**Settings screen:**

```
Simple settings page mockup, title "Zalo Translator", dropdowns "Source language: Vietnamese" and "Target language: English", blue Save button, clean system font, white page, 1280x800, no logos.
```

After generating, **composite** a real cropped screenshot of your `demo.html` or Zalo if reviewers care about accuracy—or use the demo HTML as screenshot #1 (honest: shows your UI component).

## Screenshots (live Zalo)

**Recommended size:** 1280×800 (or 640×400 minimum).

### Steps

1. Load the extension unpacked (`chrome://extensions`).
2. Open https://chat.zalo.me/ and a chat with **Vietnamese incoming messages** (or send yourself test messages from another account).
3. Confirm blue **EN** lines appear under messages.
4. Resize the browser window:
   - **Option A:** Drag window until the chat + translations look good; screenshot the window.
   - **Option B:** DevTools → toggle device toolbar → set dimensions **1280 × 800** → capture screenshot.
5. **macOS:** `Cmd + Shift + 5` → capture window or selected region.
6. **Chrome:** `Cmd + Shift + P` → “Capture screenshot” → “Capture node screenshot” (select the chat panel for a clean crop).

**What to show**

- Screenshot 1: Chat with Vietnamese text + EN translation lines (hero shot).
- Screenshot 2 (optional): Extension popup with “Auto-translate Vietnamese” checked.
- Screenshot 3 (optional): Settings page (`vi` → `en`).

Blur names/avatars if you use a real chat, or use a test account.

**Do not** include unrelated sites or misleading “translate everything” UI.

## Copy-paste listing text

**Short description** (max 132 chars):

```
Translate incoming Vietnamese Zalo Web messages to English via Google Translate. No API key. Not affiliated with Zalo.
```

**Detailed description:**

```
Zalo Translator adds English translations under incoming Vietnamese messages on Zalo Web (chat.zalo.me).

The Zalo mobile app can translate chats; the browser version does not. This extension fills that gap for Vietnamese → English only.

• Automatic translation for received messages that look Vietnamese
• Toggle on/off from the toolbar popup
• Uses Google Translate (no API key required)
• Settings for English variant (US/UK)

Not affiliated with Zalo or VNG Corporation.

Privacy: message text is sent to Google for translation only when needed. See the privacy policy URL in this listing.
```

**Single purpose (dashboard):**

```
Translate incoming Vietnamese chat messages on Zalo Web to English.
```

**Permission justifications**

- `storage` — Remember whether translation is enabled and language preferences.
- `https://chat.zalo.me/*`, `https://zalo.me/*` — Inject translation UI only on Zalo Web.
- `https://translate.googleapis.com/*` — Request translations from Google.

**Data usage (dashboard):**

- Collects / handles: **User-provided content** (message text submitted for translation).
- Not used for: marketing, creditworthiness, etc.
- Not sold. Not transferred to third parties except Google for translation.

**Remote code:** No — only packaged extension scripts; network calls are translation API requests.

## Versioning on each upload

Bump `"version"` in `manifest.json` (e.g. `0.3.1` → `1.0.0` for first public store release). Zip the folder without `.git` or `.pem`, upload in the dashboard.

## Support URL

https://github.com/shaandre96/zalo-translator/issues
