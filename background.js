importScripts("lang-utils.js");

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

const GOOGLE_URL = "https://translate.googleapis.com/translate_a/single";
const MIN_INTERVAL_MS = 450;
const BACKOFF_MS = 60_000;

let lastRequestAt = 0;
let backoffUntil = 0;
const queue = [];
/** @type {Map<string, Promise<{translation?: string, detected?: string, error?: string}>>} */
const queuedByText = new Map();
let pumping = false;

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req?.type === "translate") {
    enqueueTranslate(req.text)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: formatFetchError(err) }));
    return true;
  }
});

function formatFetchError(err) {
  const msg = err?.message || String(err);
  if (msg === "Failed to fetch") {
    return "Network error talking to Google Translate (often rate limiting). Wait ~1 minute.";
  }
  return msg;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function enqueueTranslate(text) {
  if (queuedByText.has(text)) return queuedByText.get(text);

  const p = new Promise((resolve) => {
    queue.push({ text, resolve });
    pumpQueue();
  }).finally(() => {
    queuedByText.delete(text);
  });

  queuedByText.set(text, p);
  return p;
}

async function pumpQueue() {
  if (pumping) return;
  pumping = true;

  while (queue.length > 0) {
    const now = Date.now();
    if (now < backoffUntil) {
      await sleep(backoffUntil - now);
    }

    const gap = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (gap > 0) await sleep(gap);

    const job = queue.shift();
    if (!job) break;

    try {
      const result = await translate(job.text);
      if (result.error) {
        const rateLimited =
          result.error.includes("rate-limit") ||
          result.error.includes("429") ||
          result.error.includes("Network error");
        if (rateLimited) backoffUntil = Date.now() + BACKOFF_MS;
      } else {
        lastRequestAt = Date.now();
      }
      job.resolve(result);
    } catch (err) {
      const error = formatFetchError(err);
      backoffUntil = Date.now() + BACKOFF_MS;
      job.resolve({ error });
    }
  }

  pumping = false;
}

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
