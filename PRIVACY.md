# Privacy Policy — Zalo Translator

**Last updated:** May 26, 2026

Zalo Translator is a browser extension that translates incoming Vietnamese messages on Zalo Web to English. This policy describes what data the extension handles.

## Summary

- We do **not** run our own servers or user accounts.
- We do **not** sell or use your data for advertising.
- Message text is sent to **Google Translate** only when the extension translates a message.
- Preferences are stored locally in your browser via Chrome’s extension storage.

## Data sent to third parties

When auto-translate is enabled and a received message appears to be Vietnamese, the extension sends that **message text** to Google’s translation service (`translate.googleapis.com`) over HTTPS to obtain an English translation.

Google’s handling of that data is governed by [Google’s Privacy Policy](https://policies.google.com/privacy). We do not control Google’s servers or retention practices.

## Data stored on your device

The extension may store:

- Whether auto-translate is on or off
- Source and target language codes (e.g. Vietnamese → English)

These are saved with `chrome.storage.sync` and may sync across your Chrome profile if you use Chrome sync.

## Data we do not collect

The extension does not include analytics, crash reporting, or a backend that logs your chats. We do not receive copies of your messages on our own infrastructure.

## Permissions

- **Zalo Web** (`chat.zalo.me`, `zalo.me`) — to read message text in the page and show translations.
- **Google Translate** — to request translations.
- **Storage** — to remember your settings.

## Your choices

- Turn off translation via the extension popup.
- Uninstall the extension to stop all behavior.

## Children

This extension is not directed at children under 13.

## Changes

We may update this policy by posting a new version in the [project repository](https://github.com/shaandre96/zalo-translator). The “Last updated” date will change when we do.

## Contact

Questions: open an issue at [github.com/shaandre96/zalo-translator/issues](https://github.com/shaandre96/zalo-translator/issues).

## Disclaimer

Zalo Translator is not affiliated with, endorsed by, or sponsored by Zalo or VNG Corporation.
