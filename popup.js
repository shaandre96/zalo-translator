const enabledEl = document.getElementById("enabled");
const optsEl = document.getElementById("opts");

chrome.storage.sync.get(["enabled"]).then(({ enabled }) => {
  enabledEl.checked = enabled !== false;
});

enabledEl.addEventListener("change", async () => {
  const enabled = enabledEl.checked;
  await chrome.storage.sync.set({ enabled });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "set-enabled", enabled }).catch(() => {});
  }
});

optsEl.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
