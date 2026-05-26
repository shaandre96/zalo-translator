(() => {
  const STATE = { enabled: true };
  const CACHE = new Map();
  const INFLIGHT = new Map();

  const VI_DIACRITICS =
    /[àáảãạâấầẩẫậăắằẳẵặèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;

  const RECV_SELECTOR = '[data-id="div_ReceivedMsg_Text"]';

  function isLikelyVietnamese(text) {
    return !!text && text.length >= 2 && VI_DIACRITICS.test(text);
  }

  function getTranslation(text) {
    if (CACHE.has(text)) return Promise.resolve({ translation: CACHE.get(text) });
    if (INFLIGHT.has(text)) return INFLIGHT.get(text);

    const p = chrome.runtime
      .sendMessage({ type: "translate", text })
      .then((res) => {
        INFLIGHT.delete(text);
        if (res?.error) {
          console.warn("[zalo-translator]", res.error);
          return { error: res.error };
        }
        const translation = res?.translation || "";
        if (translation) CACHE.set(text, translation);
        return { translation };
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
    div.innerHTML = '<span class="zt-label">EN</span> <span class="zt-body"></span>';
    div.querySelector(".zt-body").textContent = translation;
    bubble.parentNode.insertBefore(div, bubble.nextSibling);
  }

  async function process(bubble) {
    if (!STATE.enabled) return;
    if (bubble.nextElementSibling?.classList?.contains("zt-translation")) return;
    const text = (bubble.innerText || "").trim();
    if (!isLikelyVietnamese(text)) return;
    const result = await getTranslation(text);
    if (result?.translation) inject(bubble, result.translation);
    else if (result?.error) inject(bubble, "Translation unavailable — try again shortly.", true);
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

  chrome.storage.sync.get(["enabled"]).then(({ enabled }) => {
    STATE.enabled = enabled !== false;
    if (STATE.enabled) scan(document.body);
  });
})();
