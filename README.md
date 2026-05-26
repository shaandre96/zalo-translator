# Zalo Translator

A Chrome extension that adds **Vietnamese → English** translations to [Zalo Web](https://chat.zalo.me/) (`chat.zalo.me` / `zalo.me`).

Zalo’s mobile app can translate messages in chat; the browser client does not. If you read Vietnamese chats in the web UI and want English inline, this fills that gap.

This extension is intentionally narrow: **incoming Vietnamese messages only**, translated to English. That matches Zalo’s user base and how I use it day to day—not a general-purpose translator for every site or language pair.

## Why this exists

There are other extensions on the Chrome Web Store that do similar things for Zalo. I used one and hit **rate limits on my messages** (throttling from the extension’s backend, not Zalo itself). Google’s public translate endpoint is free at typical chat volume, so I built this to avoid paying for a commercial proxy.

**Expectations:** translations come from Google Translate. They are fine for gist and logistics; they will not carry tone, slang, or social context the way a human would. I do not expect machine translation to do that.

## How it works

- Runs only on Zalo Web chat pages.
- Watches for **received** message bubbles and checks for Vietnamese (diacritic characters).
- Requests a translation via Google’s `translate.googleapis.com` endpoint (same family of API the web translator uses—**no API key** in settings).
- Inserts a small **EN** line under the original message.
- Caches repeated text and deduplicates in-flight requests to keep traffic reasonable.

Use the toolbar popup to turn auto-translate on or off. **Settings** lets you pick source (`vi` or auto-detect) and English variant (`en`, `en-US`, `en-GB`).

## Install from source (unpacked)

For development or if you found this repo on GitHub:

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).
5. Open [Zalo Web](https://chat.zalo.me/) and sign in. Incoming Vietnamese messages should show an English line underneath when the extension is enabled.

To update after pulling changes: go to `chrome://extensions` and click the refresh icon on **Zalo Translator**, then reload the Zalo tab.

## Usage

1. Install the extension (Chrome Web Store or unpacked—see above).
2. Open Zalo Web and a conversation.
3. Click the extension icon and ensure **Auto-translate Vietnamese** is checked.
4. Optional: open **Settings** to adjust language codes (defaults: `vi` → `en`).

Translations appear only under messages that look Vietnamese; English and other text are left alone.

## Rate limits

Google may return HTTP 429 if you translate a very large number of messages in a short window from the same IP. The extension surfaces that in the console and skips showing a line for that message. Normal chat use is usually fine; bulk backfills through old history can trigger limits.

## Privacy

- The extension does not implement its own accounts or analytics.
- Message text is sent to **Google Translate** over HTTPS when a bubble needs translation.
- Settings (`enabled`, language codes) are stored in `chrome.storage.sync` (Chrome sync, if enabled on your profile).
- Host permissions are limited to Zalo Web and `translate.googleapis.com`.

**Privacy policy (Chrome Web Store):** [https://shaandre96.github.io/zalo-translator/](https://shaandre96.github.io/zalo-translator/) — enable GitHub Pages from the `/docs` folder (see [STORE.md](STORE.md)).

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save on/off and language preferences |
| `https://chat.zalo.me/*`, `https://zalo.me/*` | Inject translation UI on Zalo Web only |
| `https://translate.googleapis.com/*` | Call Google Translate |

## Publishing to the Chrome Web Store (maintainers)

1. Zip the extension directory (include `manifest.json`, scripts, HTML, CSS—not `.git`, `node_modules`, or signing keys).
2. Register a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole) (one-time fee).
3. Create a new item, upload the zip, and fill listing copy aligned with this README (Vietnamese → English, Zalo Web only, Google Translate, no API key).
4. Provide store assets: 128×128 icon, screenshots on Zalo Web, short and detailed descriptions.
5. Declare **single purpose** (translate Zalo Web messages) and data use (message text sent to Google for translation).
6. After review, publish or submit for review.

Keep `*.pem` and `*.crx` out of git (see `.gitignore`)—use them only locally for signing if you use Chrome’s packing flow.

## Development

No build step: plain Manifest V3 JavaScript, HTML, and CSS. Edit files, reload the extension on `chrome://extensions`, and refresh the Zalo tab.

```
zalo-translator/
├── manifest.json
├── background.js      # Google Translate requests
├── content.js         # DOM observer + injection
├── content.css
├── popup.html / popup.js
└── options.html / options.js
```

## License

[MIT](LICENSE)
