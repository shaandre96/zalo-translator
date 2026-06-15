const langsEl = document.getElementById("langs");
const targetEl = document.getElementById("target");
const statusEl = document.getElementById("status");
const boxes = () => Array.from(langsEl.querySelectorAll('input[type="checkbox"]'));

chrome.storage.sync.get(["sourceLangs", "targetLang"]).then(({ sourceLangs, targetLang }) => {
  const selected = Array.isArray(sourceLangs) ? sourceLangs : ZTLang.DEFAULT_SOURCE_LANGS;
  boxes().forEach((cb) => {
    cb.checked = selected.includes(cb.value);
  });
  targetEl.value = typeof targetLang === "string" ? targetLang : ZTLang.DEFAULT_TARGET_LANG;
});

document.getElementById("save").addEventListener("click", async () => {
  const sourceLangs = boxes()
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  if (sourceLangs.length === 0) {
    statusEl.textContent = "Select at least one source language.";
    setTimeout(() => (statusEl.textContent = ""), 3000);
    return;
  }
  await chrome.storage.sync.set({ sourceLangs, targetLang: targetEl.value });
  statusEl.textContent = "Saved.";
  setTimeout(() => (statusEl.textContent = ""), 2000);
});
