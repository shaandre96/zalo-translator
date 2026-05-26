const GOOGLE_URL = "https://translate.googleapis.com/translate_a/single";

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req?.type === "translate") {
    translate(req.text)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message || String(err) }));
    return true;
  }
});

async function translate(text) {
  const { sourceLang = "vi", targetLang = "en" } = await chrome.storage.sync.get([
    "sourceLang",
    "targetLang",
  ]);

  const url =
    `${GOOGLE_URL}?client=gtx` +
    `&sl=${encodeURIComponent(sourceLang)}` +
    `&tl=${encodeURIComponent(targetLang)}` +
    `&dt=t`;

  const body = `q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

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
  const detected = data?.[2] || sourceLang;

  return { translation, detected };
}
