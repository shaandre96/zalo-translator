(() => {
  const DEFAULT_SOURCES = ZTLang.DEFAULT_SOURCE_LANGS;
  const DEFAULT_TARGET = ZTLang.DEFAULT_TARGET_LANG;
  const STATE = {
    enabled: true,
    sourceLangs: DEFAULT_SOURCES.slice(),
    targetLang: DEFAULT_TARGET,
  };
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
    div.innerHTML = '<span class="zt-label"></span> <span class="zt-body"></span>';
    div.querySelector(".zt-label").textContent = ZTLang.targetLabel(STATE.targetLang);
    div.querySelector(".zt-body").textContent = translation;
    bubble.parentNode.insertBefore(div, bubble.nextSibling);
  }

  async function process(bubble) {
    if (!STATE.enabled) return;
    if (bubble.nextElementSibling?.classList?.contains("zt-translation")) return;
    const text = (bubble.innerText || "").trim();
    if (!text) return;
    const isVi = ZTLang.isLikelyVietnamese(text);
    if (!ZTLang.shouldRequest(isVi, STATE.sourceLangs, STATE.targetLang)) return;
    const result = await getTranslation(text);
    if (result?.error) {
      inject(bubble, "Translation unavailable — try again shortly.", true);
      return;
    }
    if (
      result?.translation &&
      ZTLang.shouldTranslate(result.detected, STATE.sourceLangs, STATE.targetLang)
    ) {
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
    let changed = false;
    if (changes.sourceLangs) {
      STATE.sourceLangs = Array.isArray(changes.sourceLangs.newValue)
        ? changes.sourceLangs.newValue
        : DEFAULT_SOURCES.slice();
      changed = true;
    }
    if (changes.targetLang) {
      STATE.targetLang =
        typeof changes.targetLang.newValue === "string"
          ? changes.targetLang.newValue
          : DEFAULT_TARGET;
      // Cached translations target the old language — discard them.
      CACHE.clear();
      changed = true;
    }
    if (changed) {
      removeAllTranslations();
      if (STATE.enabled) scan(document.body);
    }
  });

  chrome.storage.sync
    .get(["enabled", "sourceLangs", "targetLang"])
    .then(({ enabled, sourceLangs, targetLang }) => {
      STATE.enabled = enabled !== false;
      if (Array.isArray(sourceLangs)) STATE.sourceLangs = sourceLangs;
      if (typeof targetLang === "string") STATE.targetLang = targetLang;
      if (STATE.enabled) scan(document.body);
    });
})();
