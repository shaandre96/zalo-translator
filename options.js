const sourceEl = document.getElementById("source");
const targetEl = document.getElementById("target");
const statusEl = document.getElementById("status");

chrome.storage.sync
  .get(["sourceLang", "targetLang"])
  .then(({ sourceLang, targetLang }) => {
    if (sourceLang) sourceEl.value = sourceLang;
    if (targetLang) targetEl.value = targetLang;
  });

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    sourceLang: sourceEl.value,
    targetLang: targetEl.value,
  });
  statusEl.textContent = "Saved.";
  setTimeout(() => (statusEl.textContent = ""), 2000);
});
